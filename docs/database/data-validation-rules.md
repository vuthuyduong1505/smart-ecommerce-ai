# Database Specification v1.2.1: Quy tắc Kiểm thực & Toàn vẹn Dữ liệu (Data Validation & Integrity Rules)
**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect  
**Phiên bản:** 1.2.1 (Technical Consistency & Refinement Edition)  
**Ngày cập nhật:** 15/11/2026  

---

## 1. Kiến trúc Toàn vẹn Dữ liệu Đa tầng (Multi-layered Integrity Architecture)

Để đảm bảo dữ liệu trong hệ thống MongoDB luôn sạch, hợp lệ và chống lại lỗi logic nghiệp vụ, dự án áp dụng chiến lược phòng thủ 3 tầng:

```
[Layer 1: Client / Web Form]   --> HTML5 / Zod / React Hook Form
              |
              v
[Layer 2: Application Layer]   --> Spring Boot (Jakarta Validation @Valid, @NotNull, @Min)
              |                    FastAPI (Pydantic v2 Schema Validation)
              v
[Layer 3: Database Engine]     --> MongoDB JSON Schema Validation ($jsonSchema) + Partial Unique Indexes
```

---

## 2. Toàn vẹn Tham chiếu (Referential Integrity) trong MongoDB

Không giống như RDBMS với `FOREIGN KEY ... ON DELETE CASCADE`, MongoDB không hỗ trợ kiểm tra khóa ngoại tự động tại tầng lưu trữ. Do đó, toàn vẹn tham chiếu được quản lý chặt chẽ theo các quy tắc sau:

1. **Ngăn chặn Xóa vật lý (Soft Delete Pattern):**
   - Không thực hiện lệnh `deleteOne` đối với các thực thể cốt lõi (`products`, `categories`, `brands`, `users`).
   - Sử dụng cờ trạng thái (`status: "ARCHIVED"` hoặc `isActive: false`).
   - *Lợi ích:* Tránh tạo ra các bản ghi mồ côi (Orphan records) trong `orders` hoặc `product_reviews`.
2. **Kiểm tra hợp lệ trước khi tạo (Application-level Foreign Key Validation):**
   - Khi tạo hoặc cập nhật một sản phẩm trong Spring Boot, service bắt buộc truy vấn kiểm tra `categories.findById(categoryId)` và `brands.findById(brandId)` tồn tại và đang `isActive` trước khi tiến hành `save()`.
3. **Historic Snapshotting:**
   - Trong `orders`, toàn bộ thông tin sản phẩm (`sku`, `productName`, `unitPrice`, `thumbnailUrl`) được snapshot nhúng độc lập. Kể cả khi sản phẩm gốc bị sửa đổi hoặc ngừng kinh doanh, dữ liệu hóa đơn trong quá khứ vẫn toàn vẹn 100%.

---

## 3. MongoDB `$jsonSchema` Validation Chi tiết

### 3.1. Collection: `products` (Kiểm thực Đa hình & Tồn kho Hai Mức)

```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "sku",
        "name",
        "slug",
        "categoryId",
        "categorySlug",
        "brandId",
        "brandName",
        "listPrice",
        "salePrice",
        "currency",
        "inventory",
        "inStock",
        "status",
        "attributes"
      ],
      properties: {
        sku: {
          bsonType: "string",
          pattern: "^[A-Z0-9_-]{4,50}$",
          description: "SKU phải từ 4-50 ký tự viết hoa, số, dấu gạch ngang hoặc dưới"
        },
        name: {
          bsonType: "string",
          minLength: 5,
          maxLength: 255,
          description: "Tên sản phẩm phải từ 5 đến 255 ký tự"
        },
        slug: {
          bsonType: "string",
          pattern: "^[a-z0-9-]+$",
          description: "Slug chuẩn URL thân thiện"
        },
        categoryId: {
          bsonType: "objectId"
        },
        categorySlug: {
          enum: ["laptop", "phone", "tablet", "accessories"],
          description: "Thuộc 1 trong 4 danh mục cốt lõi"
        },
        brandId: {
          bsonType: "objectId"
        },
        listPrice: {
          bsonType: "decimal",
          description: "Giá niêm yết Decimal128"
        },
        salePrice: {
          bsonType: "decimal",
          description: "Giá bán thực tế Decimal128"
        },
        currency: {
          enum: ["VND"]
        },
        inventory: {
          bsonType: "object",
          required: ["quantity", "reserved"],
          properties: {
            quantity: {
              bsonType: "int",
              minimum: 0,
              description: "Tồn kho thực tế không được âm"
            },
            reserved: {
              bsonType: "int",
              minimum: 0,
              description: "Số lượng giữ không được âm"
            }
          }
        },
        inStock: {
          bsonType: "bool"
        },
        status: {
          enum: ["DRAFT", "ACTIVE", "ARCHIVED"]
        },
        attributes: {
          bsonType: "object",
          description: "Chứa thông số kỹ thuật đa hình"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

---

### 3.2. Collection: `orders` (Kiểm thực IdempotencyKey, Trạng thái Kép, Reservation Lifecycle & Refund)

```javascript
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "orderCode",
        "idempotencyKey",
        "userId",
        "reservationId",
        "reservationStatus",
        "orderStatus",
        "paymentStatus",
        "shippingAddress",
        "payment",
        "items",
        "subtotal",
        "grandTotal",
        "expiresAt",
        "createdAt"
      ],
      properties: {
        orderCode: {
          bsonType: "string",
          pattern: "^ORD-[0-9]{8}-[A-Z0-9]{4}$",
          description: "Mã đơn hàng chuẩn quy cách hiển thị"
        },
        idempotencyKey: {
          bsonType: "string",
          minLength: 10,
          description: "Khóa bất biến chống trùng đơn khi checkout"
        },
        userId: {
          bsonType: "objectId"
        },
        reservationId: {
          bsonType: "string",
          description: "UUID định danh phiên giữ hàng active hiện tại"
        },
        reservationStatus: {
          enum: ["PENDING", "CONFIRMED", "RELEASED", "EXPIRED"],
          description: "Máy trạng thái giữ kho: EXPIRED là terminal, không tái kích hoạt trực tiếp"
        },
        reservationHistory: {
          bsonType: "array",
          description: "Lịch sử các phiên giữ hàng (ghi nhận khi webhook đến muộn tạo reservation mới)",
          items: {
            bsonType: "object",
            required: ["reservationId", "status", "createdAt"],
            properties: {
              reservationId: { bsonType: "string" },
              status: { enum: ["PENDING", "CONFIRMED", "RELEASED", "EXPIRED"] },
              createdAt: { bsonType: "date" },
              expiredAt: { bsonType: "date" },
              reason: { bsonType: "string" }
            }
          }
        },
        orderStatus: {
          enum: [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "EXPIRED"
          ],
          description: "Trạng thái vận hành và giao nhận đơn hàng"
        },
        paymentStatus: {
          enum: [
            "UNPAID",
            "PENDING_GATEWAY",
            "PAID",
            "FAILED",
            "REFUND_PENDING",
            "REFUNDED",
            "REFUND_FAILED",
            "EXPIRED",
            "PAID_LATE"
          ],
          description: "Trạng thái dòng tiền & vòng đời thanh toán/hoàn tiền đầy đủ"
        },
        shippingAddress: {
          bsonType: "object",
          required: ["receiverName", "phoneNumber", "fullAddress"],
          properties: {
            receiverName: { bsonType: "string", minLength: 2 },
            phoneNumber: { bsonType: "string", pattern: "^0[0-9]{9}$" },
            fullAddress: { bsonType: "string", minLength: 10 }
          }
        },
        payment: {
          bsonType: "object",
          required: ["method"],
          properties: {
            method: { enum: ["COD", "VNPAY", "MOMO", "BANK_TRANSFER"] },
            gatewayTransactionId: { bsonType: "string" },
            gatewayName: { enum: ["VNPAY", "MOMO"] },
            paidAt: { bsonType: "date" },
            refund: {
              bsonType: "object",
              required: ["refundId", "idempotencyKey", "amount", "status", "reason", "requestedAt"],
              description: "Thông tin giao dịch hoàn tiền đơn chuẩn hóa v1.2.1",
              properties: {
                refundId: { bsonType: "string" },
                idempotencyKey: { bsonType: "string" },
                gatewayRefundId: { bsonType: ["string", "null"] },
                amount: { bsonType: "decimal" },
                status: { enum: ["REFUND_PENDING", "REFUNDED", "REFUND_FAILED"] },
                reason: { bsonType: "string" },
                requestedAt: { bsonType: "date" },
                processedAt: { bsonType: ["date", "null"] },
                retryCount: { bsonType: "int", minimum: 0 },
                lastError: { bsonType: ["string", "null"] }
              }
            }
          }
        },
        items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["productId", "sku", "productName", "unitPrice", "quantity", "returnedQuantity", "refundedQuantity", "totalPrice"],
            properties: {
              productId: { bsonType: "objectId" },
              sku: { bsonType: "string" },
              productName: { bsonType: "string" },
              unitPrice: { bsonType: "decimal" },
              quantity: { bsonType: "int", minimum: 1 },
              returnedQuantity: {
                bsonType: "int",
                minimum: 0,
                description: "Số lượng hàng trả lại vật lý (0 <= returnedQuantity <= quantity)"
              },
              refundedQuantity: {
                bsonType: "int",
                minimum: 0,
                description: "Số lượng hàng hoàn tiền tài chính (0 <= refundedQuantity <= quantity)"
              },
              totalPrice: { bsonType: "decimal" }
            }
          }
        },
        subtotal: { bsonType: "decimal" },
        shippingFee: { bsonType: "decimal" },
        discountAmount: { bsonType: "decimal" },
        grandTotal: { bsonType: "decimal" },
        expiresAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
```

---

### 3.3. Collection: `carts` (Kiểm thực Giỏ hàng Dành riêng cho Người dùng Đã Xác thực)

> [!NOTE]
> **Quy tắc Nghiệp vụ Giỏ hàng v1.2.1:**  
> 1. Chỉ người dùng đã đăng nhập mới được tạo giỏ hàng (`userId` bắt buộc kiểu `objectId`, Unique Index `{ userId: 1 }`). Bỏ hoàn toàn enum `cartType`, `sessionId` và `oneOf`.  
> 2. Một sản phẩm chỉ xuất hiện tối đa một lần trong `items`.  
> 3. Giới hạn giỏ hàng: Tối đa **50 items/cart**; số lượng mua mỗi item từ **1 đến 10**.  
> 4. **Loại bỏ Cart TTL 30 ngày:** Chính sách tự động hết hạn hoặc xóa Cart chưa được phê duyệt và chưa triển khai trong phiên bản hiện tại (loại bỏ trường `expiresAt` và TTL Index).

```javascript
db.createCollection("carts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "items", "createdAt", "updatedAt"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "ID người dùng sở hữu giỏ hàng, bắt buộc kiểu ObjectId"
        },
        items: {
          bsonType: "array",
          maxItems: 50,
          description: "Danh sách sản phẩm trong giỏ hàng (tối đa 50 items)",
          items: {
            bsonType: "object",
            required: ["productId", "quantity", "addedAt"],
            properties: {
              productId: {
                bsonType: "objectId",
                description: "ID sản phẩm tham chiếu products"
              },
              quantity: {
                bsonType: "int",
                minimum: 1,
                maximum: 10,
                description: "Số lượng sản phẩm cho phép từ 1 đến 10"
              },
              addedAt: {
                bsonType: "date",
                description: "Thời điểm thêm sản phẩm vào giỏ"
              },
              updatedAt: {
                bsonType: "date",
                description: "Thời điểm cập nhật số lượng gần nhất"
              }
            }
          }
        },
        createdAt: {
          bsonType: "date",
          description: "Thời điểm khởi tạo giỏ hàng"
        },
        updatedAt: {
          bsonType: "date",
          description: "Thời điểm cập nhật giỏ hàng gần nhất"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

---

## 4. Các Quy tắc Kiểm thực Nghiệp vụ tại Application Layer (Java 21 / Spring Boot)

Do `$jsonSchema` của MongoDB không hỗ trợ so sánh giá trị giữa hai trường trong cùng một document (cross-field comparison), các quy tắc nghiệp vụ sau được bảo đảm tại tầng Service của Spring Boot:

### 4.1. So sánh Số học Chuẩn mực với `BigDecimal`
> [!IMPORTANT]
> Trong Java, **bắt buộc sử dụng `compareTo() == 0`** khi so sánh bằng giá trị tiền tệ, tuyệt đối không dùng `equals()`.  
> *Lý do:* `new BigDecimal("100.0").equals(new BigDecimal("100.00"))` sẽ trả về `false` do khác biệt về scale, trong khi `compareTo()` so sánh chính xác giá trị số học.

```java
// Kiểm tra giá bán không được lớn hơn giá niêm yết:
if (product.getSalePrice().compareTo(product.getListPrice()) > 0) {
    throw new BusinessValidationException("Giá khuyến mãi (salePrice) không được lớn hơn giá niêm yết (listPrice)!");
}

// Kiểm tra giá không được âm:
if (product.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
    throw new BusinessValidationException("Giá bán không được là số âm!");
}
```

### 4.2. Quy tắc Làm tròn Tiền tệ (VND Currency Rounding Rules)
- Tiền tệ Việt Nam Đồng (VND) không sử dụng đơn vị tiền lẻ (xu/hào).
- Mọi phép tính giảm giá theo tỷ lệ phần trăm (percentage discount) hoặc chia tỷ lệ phải được làm tròn về **số nguyên gần nhất** bằng chế độ `RoundingMode.HALF_UP`:
  ```java
  BigDecimal rawDiscount = listPrice.multiply(discountPercent);
  BigDecimal roundedDiscount = rawDiscount.setScale(0, RoundingMode.HALF_UP);
  ```

### 4.3. Kiểm tra Tường minh (Explicit Validation) Trước khi Chuyển Decimal128 sang Int64
> [!CAUTION]
> Tuyệt đối **không thực hiện ép kiểu ngầm (silent truncation / silent rounding)** khi chuyển đổi từ `Decimal128` sang `Int64` (`NumberLong`) cho Vector Metadata (`salePriceVnd`) hoặc tham số cổng thanh toán (VNPAY/MoMo).
> Nếu phát hiện giá trị VND có phần thập phân khác 0, hệ thống phải **từ chối ngay (REJECT)** và ghi log cảnh báo dữ liệu dị thường.

```java
public static long convertDecimal128ToInt64Vnd(Decimal128 decimal128Value, String fieldName) {
    if (decimal128Value == null) {
        throw new IllegalArgumentException("Trường " + fieldName + " không được null!");
    }
    BigDecimal value = decimal128Value.bigDecimalValue();

    // 1. Kiểm tra phần thập phân: tiền VND bắt buộc là số nguyên
    if (value.scale() > 0 && value.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
        log.error("VIOLATION: Dữ liệu tiền VND có phần thập phân khác 0! field={}, value={}", fieldName, value);
        throw new InvalidCurrencyScaleException("Giá trị tiền VND không được chứa phần thập phân: " + value);
    }

    // 2. Chuyển đổi chính xác sang Int64 với RoundingMode.UNNECESSARY (báo lỗi nếu có bất kỳ phần lẻ nào)
    try {
        return value.setScale(0, RoundingMode.UNNECESSARY).longValueExact();
    } catch (ArithmeticException ex) {
        log.error("FATAL: Không thể chuyển giá trị sang Int64 an toàn! field={}, value={}", fieldName, value, ex);
        throw new InvalidCurrencyScaleException("Không thể chuyển đổi giá trị tiền sang Int64: " + value, ex);
    }
}
```

### 4.4. Kiểm thực Toàn vẹn Tính toán Đơn hàng (Grand Total Integrity)
```java
BigDecimal calculatedSubtotal = BigDecimal.ZERO;
for (OrderItem item : order.getItems()) {
    BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    if (itemTotal.compareTo(item.getTotalPrice()) != 0) {
        throw new InvalidOrderException("Thành tiền của sản phẩm " + item.getSku() + " không chính xác!");
    }
    calculatedSubtotal = calculatedSubtotal.add(itemTotal);
}

BigDecimal calculatedGrandTotal = calculatedSubtotal
        .add(order.getShippingFee())
        .subtract(order.getDiscountAmount());

if (calculatedGrandTotal.compareTo(order.getGrandTotal()) != 0) {
    throw new InvalidOrderException("Tổng thanh toán đơn hàng (grandTotal) không khớp với giá trị tính toán!");
}
```

### 4.5. Kiểm thực Đánh giá Đã Mua Hàng Thật (Verified Purchase Validation & Review Policy)
Chính sách đánh giá (Review Policy - APPROVED):
1. Khách hàng chỉ được phép gửi đánh giá nếu đã mua sản phẩm trong một đơn hàng có `orderStatus == "DELIVERED"` và `paymentStatus == "PAID"`.
2. Trường hợp hoàn tiền / hủy toàn phần (`paymentStatus == "REFUNDED"`): Hủy quyền đánh giá (`isVerifiedPurchase = false` hoặc từ chối tạo review).
3. **Xử lý Trả hàng và Hoàn tiền Một phần (Partial Return / Refund):**
   - Được quản lý theo số lượng thông qua 2 trường: `returnedQuantity` (hàng trả lại vật lý) và `refundedQuantity` (hàng hoàn tiền tài chính) với điều kiện $0 \le returnedQuantity \le quantity$ và $0 \le refundedQuantity \le quantity$.
   - Quyền đánh giá xét theo **số lượng thực tế khách hàng còn giữ lại**: $\text{quantity} - \text{returnedQuantity} > 0$ (tức là $\text{returnedQuantity} < \text{quantity}$).
   - Nếu khách hàng đã trả lại toàn bộ sản phẩm ($\text{returnedQuantity} == \text{quantity}$): Hủy quyền đánh giá đối với sản phẩm đó.
   - Nếu khách hàng chỉ trả lại một phần (ví dụ: mua 3 laptop trả 1 laptop): Khách hàng **vẫn có quyền đánh giá** sản phẩm vì vẫn thực tế giữ lại 2 laptop.
4. Mỗi khách hàng chỉ có tối đa 1 đánh giá kích hoạt (`status: { $in: ["PENDING", "APPROVED"] }`) cho mỗi sản phẩm. Nếu đánh giá cũ bị xóa mềm (`status: "DELETED"`), khách hàng được phép gửi đánh giá mới.

```java
public boolean isEligibleForVerifiedPurchase(ObjectId userId, ObjectId productId) {
    // 1. Tìm đơn hàng đã giao và đã thanh toán của người dùng chứa sản phẩm này
    List<Order> deliveredOrders = orderRepository.findByUserIdAndOrderStatusAndPaymentStatus(
            userId,
            OrderStatus.DELIVERED,
            PaymentStatus.PAID
    );
    if (deliveredOrders.isEmpty()) {
        return false;
    }

    // 2. Kiểm tra xem có đơn hàng nào chứa sản phẩm này mà khách thực sự giữ lại ít nhất 1 sản phẩm
    for (Order order : deliveredOrders) {
        // Nếu toàn bộ đơn hàng bị hoàn tiền -> bỏ qua
        if (order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            continue;
        }

        // Kiểm tra item cụ thể trong đơn: khách thực sự giữ lại ít nhất 1 sản phẩm vật lý (returnedQuantity < quantity)
        boolean hasKeptItem = order.getItems().stream()
                .anyMatch(item -> item.getProductId().equals(productId)
                        && item.getReturnedQuantity() < item.getQuantity());

        if (hasKeptItem) {
            return true; // Thỏa mãn điều kiện Verified Purchase
        }
    }

    return false;
}
```

### 4.6. Kiểm thực Xác thực Người dùng & Quyền Sở hữu Giỏ hàng (Authentication & Cart Ownership)
- **Xác thực Danh tính Bắt buộc (Token Extraction):** Tầng Backend Spring Boot trích xuất `userId` trực tiếp từ JWT Access Token trong `SecurityContextHolder`. Tuyệt đối không chấp nhận `userId` truyền lên từ Client request body hoặc query parameters để ngăn chặn tấn công giả mạo danh tính (IDOR).
- **Xử lý Khách Chưa Đăng nhập:** Mọi yêu cầu gọi vào API thêm, sửa hoặc xóa giỏ hàng khi chưa có Access Token hợp lệ đều bị từ chối với mã lỗi HTTP `401 Unauthorized` và thông báo `"Vui lòng đăng nhập để thực hiện thao tác giỏ hàng"`.
- **Ràng buộc Duy nhất Sản phẩm trong Giỏ:** Mỗi sản phẩm chỉ xuất hiện tối đa một lần trong mảng `items`. Khi người dùng thêm sản phẩm đã có trong giỏ, Backend thực hiện cập nhật gia số `items.$.quantity` thay vì thêm một subdocument mới.
- **Giới hạn Dung lượng Giỏ hàng:** Giỏ hàng cho phép tối đa 50 items (`maxItems: 50`); số lượng mua mỗi item bị chặn từ 1 đến 10 sản phẩm (`1 <= quantity <= 10`).
- **Nguyên tắc Tồn kho Giỏ hàng:** Giỏ hàng chỉ lưu trữ dự định mua hàng, **không tự động reserve inventory**. Việc kiểm tra và đặt trước tồn kho thực tế chỉ diễn ra khi người dùng chủ động chuyển sang bước Checkout.
- **Không áp dụng TTL Index:** Chính sách tự động hết hạn hoặc xóa Cart chưa được phê duyệt và chưa triển khai trong phiên bản hiện tại.

---

## 5. Quy chuẩn Thuộc tính Laptop Phục vụ RAG

Nhằm bảo đảm pipeline AI RAG tại FastAPI luôn có đủ dữ liệu cấu hình để so sánh và trả lời câu hỏi của khách hàng, Spring Boot kiểm tra bắt buộc khi tạo/sửa Laptop (`categorySlug == "laptop"`):
- `cpu.model`, `cpu.cores`, `cpu.boostClockGhz`.
- `gpu.model`, `gpu.vramGb`.
- `ram.capacityGb`, `ram.ramType`.
- `storage.capacityGb`, `storage.storageType`.
- `display.sizeInches`, `display.resolution`, `display.refreshRateHz`.
- `battery.capacityWh`.
- `physical.weightKg`.
- `useCases`: Phải chứa ít nhất 1 mục trong danh sách hợp lệ: `["GAMING", "OFFICE", "CREATIVE_DESIGN", "DATA_AI", "STUDENT", "THIN_LIGHT"]`.
