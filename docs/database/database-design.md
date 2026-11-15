# Database Specification v1.2.1: Thiết kế Kiến trúc Cơ sở Dữ liệu MongoDB
**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect  
**Phiên bản:** 1.2.1 (Technical Consistency & Refinement Edition)  
**Ngày cập nhật:** 15/11/2026  

---

## 1. Bối cảnh & Mục tiêu Thiết kế

### 1.1. Bối cảnh Nghiệp vụ
- **Mô hình:** Cửa hàng thương mại điện tử đơn nhất (Single-store E-commerce), không phải sàn giao dịch nhiều người bán (Multi-vendor Marketplace). Mọi sản phẩm, chính sách giá và đơn hàng đều thuộc quyền quản lý trực tiếp của một cửa hàng duy nhất.
- **Danh mục kinh doanh cốt lõi:**
  - **Laptop** (Trọng tâm tích hợp AI trong giai đoạn đầu: RAG tư vấn cấu hình, so sánh kỹ thuật, tìm kiếm ngữ nghĩa).
  - **Phone** (Điện thoại thông minh).
  - **Tablet** (Máy tính bảng).
  - **Accessories** (Phụ kiện công nghệ: chuột, bàn phím, sạc dự phòng, cáp chuyển đổi, bao da,...).
- **Các module AI định hướng:**
  1. **Smart Search:** Tìm kiếm từ khóa kết hợp tìm kiếm ngữ nghĩa (Hybrid Search).
  2. **Personalized Recommendation:** Gợi ý sản phẩm dựa trên hành vi duyệt, thêm giỏ hàng và danh mục liên quan.
  3. **AI Product Advisor:** Trợ lý ảo tư vấn sản phẩm sử dụng RAG (Retrieval-Augmented Generation) dựa trên thông số kỹ thuật thực tế của Laptop.

### 1.2. Công nghệ liên quan
- **Backend Core:** Java 21 LTS + Spring Boot 3 (Quản trị nghiệp vụ, giỏ hàng, đơn hàng, người dùng, giao dịch).
- **AI Service:** Python 3.11 + FastAPI (Xử lý vector embeddings, RAG pipeline, recommendation logic).
- **Database Engine:** MongoDB 7.0+ (Document Database, hỗ trợ Multi-document ACID transactions, TTL Indexes, và Atlas Vector Search).

---

## 2. Các Nguyên tắc Thiết kế Cốt lõi (Design Principles)

1. **Tuân thủ Document Model tự nhiên:**
   - Ưu tiên nhúng (Embedding) khi dữ liệu có quan hệ 1-1 hoặc 1-N giới hạn (bounded), dữ liệu thường xuyên được đọc cùng nhau và có vòng đời phụ thuộc vào document cha (ví dụ: `orderItems` trong `orders`, `specs` trong `products`).
   - Ưu tiên tham chiếu (Referencing qua `ObjectId`) khi dữ liệu có quan hệ 1-N không giới hạn (unbounded), dữ liệu biến động độc lập hoặc cần được tái sử dụng qua nhiều thực thể (ví dụ: `userId` trong `orders`, `categoryId` trong `products`).
2. **Phân tách ranh giới giữa Dữ liệu Nghiệp vụ (OLTP) và Dữ liệu AI/Analytics:**
   - Dữ liệu giao dịch cốt lõi (`products`, `orders`, `users`) phải đảm bảo tính toàn vẹn, hiệu năng truy vấn nhanh và nhất quán cao.
   - Dữ liệu vector embedding (`product_embeddings`) và logs tương tác người dùng (`user_events`, `search_logs`) được thiết kế tách biệt hoặc có vòng đời TTL để không làm phình to (bloat) các document nghiệp vụ khi fetch hàng ngày.
3. **Chống thất thoát dữ liệu và Chuẩn hóa Chuyển đổi Tiền tệ:**
   - Tuyệt đối không dùng số thực dấu phẩy động (`Double` / `Float`) để tính toán tiền tệ. Sử dụng `Decimal128` (BSON type 19) trong MongoDB và `BigDecimal` trong Java cho toàn bộ giá trị giá cả và tổng tiền đơn hàng.
   - Đơn vị tiền tệ chuẩn mặc định: **VND** (Việt Nam Đồng).
   - Trong code Java, so sánh số học của `BigDecimal` bắt buộc dùng `compareTo() == 0`, **tuyệt đối không dùng `equals()`** vì `equals()` so sánh cả thang đo độ chính xác (scale) khiến `2.0` khác `2.00`.
   - **Quy tắc Chuyển đổi sang Vector Metadata (`salePriceVnd` dạng `Int64`):**
     - Tiền tệ VND không có đơn vị xu lẻ. Mọi giá sản phẩm lưu trong `products.salePrice` bắt buộc phải là số nguyên không âm.
     - **Tuyệt đối không âm thầm làm tròn giá** khi sinh Vector Metadata. Nếu giá đầu vào có phần thập phân khác 0, hệ thống validation phải từ chối (reject) ngay lập tức:
       ```java
       if (product.getSalePrice().scale() > 0 && 
           product.getSalePrice().remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
           throw new BusinessValidationException("Giá VND không được chứa phần thập phân: " + product.getSalePrice());
       }
       long salePriceVnd = product.getSalePrice().longValueExact();
       ```
     - Điều này đảm bảo giá trị `metadata.salePriceVnd` trong Vector Metadata luôn khớp chính xác 100% với `products.salePrice`, giúp bộ lọc khoảng giá của Atlas Vector Search chạy chuẩn xác.
4. **Không Over-engineer:**
   - Không đưa vào các giải pháp sharding phức tạp hay microservices databases khi hệ thống đang ở quy mô single-store. Toàn bộ collections được tối ưu hóa cho một cụm MongoDB Replica Set duy nhất.
5. **Bảo mật và Quyền riêng tư:**
   - Mật khẩu phải lưu dạng băm an toàn (BCrypt/Argon2), không lưu thông tin thẻ thanh toán dạng raw text, không đưa secret keys vào database.

---

## 3. Chiến lược Mô hình hóa Dữ liệu Sản phẩm (Product Modeling)

Toàn bộ sản phẩm thuộc 4 danh mục (Laptop, Phone, Tablet, Accessories) được lưu chung trong collection `products` với cấu trúc **Single Collection Polymorphic Attributes**:
- Trường chung: `name`, `slug`, `sku`, `brandId`, `categoryId`, `listPrice`, `salePrice`, `currency`, `inventory`, `inStock`, `status`, `images`, `tags`.
- Trường chuyên biệt: Sub-document `attributes` lưu trữ thông số kỹ thuật đa hình theo `categorySlug`. Riêng Laptop lưu chi tiết CPU, GPU, RAM (loại, bus, nâng cấp), Ổ cứng, Màn hình (OLED, tần số quét, độ phủ màu), Pin (Wh), Trọng lượng và useCases phục vụ RAG.

---

## 4. Quản lý Tồn kho Hai Mức & Đặt trước (Inventory Reservation)

### 4.1. Định nghĩa Trạng thái Tồn kho
- `quantity` (Int32 $\ge 0$): Tồn kho vật lý thực tế trong kho.
- `reserved` (Int32 $\ge 0$): Số lượng đang giữ tạm cho các phiên checkout.
- **Tồn kho khả dụng (Available Stock):** $\text{availableStock} = \text{quantity} - \text{reserved}$.

```
                 [ Khách bắt đầu Checkout ]
                             |
                             v
                 +-----------------------+
                 |  1. Reserve Stock     | --> Tăng inventory.reserved
                 |  (Tạo reservationId)  |     Giữ hàng (15 phút - ĐÃ PHÊ DUYỆT)
                 +-----------+-----------+
                             |
             +---------------+---------------+
             |                               |
    [Thanh toán thành công]         [Thanh toán thất bại / Timeout]
             |                               |
             v                               v
    +-----------------------+       +-----------------------+
    | 2. Confirm Reservation|       | 3. Release Reservation|
    | - Giảm quantity       |       | - Giảm reserved       |
    | - Giảm reserved       |       | - Hoàn lại tồn kho    |
    | - reservationStatus:  |       |   khả dụng            |
    |   CONFIRMED           |       | - reservationStatus:  |
    +-----------------------+       |   RELEASED / EXPIRED  |
                                    +-----------------------+
```

### 4.2. Máy Trạng thái Reservation & Nguyên tắc Bất biến
- Mỗi reservation chỉ được chuyển trạng thái đúng một lần theo biểu đồ:
  $$\text{PENDING} \longrightarrow \begin{cases} \text{CONFIRMED} & (\text{Thanh toán thành công}) \\ \text{RELEASED} & (\text{Khách hủy / Thanh toán lỗi}) \\ \text{EXPIRED} & (\text{Hết hạn 15 phút - ĐÃ PHÊ DUYỆT}) \end{cases}$$
- **Quy tắc Idempotency:** Mọi câu lệnh cập nhật Confirm hoặc Release bắt buộc có điều kiện `reservationStatus: "PENDING"`. Nếu trạng thái đã là `CONFIRMED`, `RELEASED`, hoặc `EXPIRED`, câu lệnh không khớp bản ghi nào (`matchedCount == 0`), đảm bảo không thể Confirm hoặc Release lần thứ hai.

### 4.3. Ba Thao tác Vòng đời Tồn kho Nguyên tử (Atomic Operations)

#### Thao tác 1: Reserve Stock (Khi khách bắt đầu Checkout)
Kiểm tra điều kiện tồn kho khả dụng $\text{quantity} - \text{reserved} \ge \text{requestedQty}$ và cập nhật `inStock`:
```javascript
db.products.updateOne(
  {
    _id: productId,
    $expr: {
      $gte: [{ $subtract: ["$inventory.quantity", "$inventory.reserved"] }, requestedQty]
    }
  },
  [
    {
      $set: {
        "inventory.reserved": { $add: ["$inventory.reserved", requestedQty] },
        "inStock": {
          $gt: [
            { $subtract: ["$inventory.quantity", { $add: ["$inventory.reserved", requestedQty] }] },
            0
          ]
        },
        "updatedAt": "$$NOW"
      }
    }
  ]
);
```

#### Thao tác 2: Confirm Reservation (Khi thanh toán thành công)
Giảm đồng thời cả tồn kho thực tế và số lượng đang giữ:
```javascript
db.products.updateOne(
  {
    _id: productId,
    "inventory.reserved": { $gte: confirmedQty },
    "inventory.quantity": { $gte: confirmedQty }
  },
  [
    {
      $set: {
        "inventory.quantity": { $subtract: ["$inventory.quantity", confirmedQty] },
        "inventory.reserved": { $subtract: ["$inventory.reserved", confirmedQty] },
        "inStock": {
          $gt: [
            { $subtract: [
                { $subtract: ["$inventory.quantity", confirmedQty] },
                { $subtract: ["$inventory.reserved", confirmedQty] }
            ] },
            0
          ]
        },
        "updatedAt": "$$NOW"
      }
    }
  ]
);
```

#### Thao tác 3: Release Reservation (Khi thanh toán thất bại hoặc hết hạn)
Hoàn trả số lượng đang giữ về cho kho khả dụng:
```javascript
db.products.updateOne(
  {
    _id: productId,
    "inventory.reserved": { $gte: releasedQty }
  },
  [
    {
      $set: {
        "inventory.reserved": { $subtract: ["$inventory.reserved", releasedQty] },
        "inStock": {
          $gt: [
            { $subtract: ["$inventory.quantity", { $subtract: ["$inventory.reserved", releasedQty] }] },
            0
          ]
        },
        "updatedAt": "$$NOW"
      }
    }
  ]
);
```

### 4.4. Cạnh tranh giữa Webhook và Expiration Worker & Xử lý Webhook Đến Muộn
- **Cạnh tranh Webhook vs Expiration Worker:**
  - Cả Scheduled Worker và Webhook đều thực hiện atomic state transition trên đơn hàng với điều kiện `orderStatus: "PENDING", reservationStatus: "PENDING"`. Ai đến trước sẽ cập nhật thành công; bên đến sau sẽ nhận `matchedCount == 0` và dừng lại an toàn.
- **Quy tắc Xử lý Webhook Đến Muộn (Late-arriving Webhook):**
  - **Tuyệt đối không tái sử dụng reservation đã `EXPIRED`:** Một reservation đã hết hạn là dữ liệu lịch sử bất biến.
  - Khi Webhook thanh toán thành công đến muộn sau khi reservation cũ đã `EXPIRED`:
    1. Kiểm tra tồn kho khả dụng hiện tại $\text{quantity} - \text{reserved} \ge \text{orderQty}$.
    2. **Nếu còn hàng:** Mở một MongoDB Transaction để:
       - Tạo một **Reservation MỚI** với `reservationId` mới.
       - Lưu lịch sử reservation cũ vào mảng `reservationHistory` trong đơn hàng.
       - Thực hiện Confirm trên Reservation mới (giảm `quantity` và `reserved`).
       - Chuyển `orderStatus: "CONFIRMED"`, `paymentStatus: "PAID"`.
    3. **Nếu hết hàng (sản phẩm đã bị khách khác mua mất):**
       - Ghi nhận `paymentStatus: "PAID_LATE"`, giữ `orderStatus: "EXPIRED"`.
       - Tự động kích hoạt **Quy trình Hoàn tiền (Automated Refund Workflow)** sang cổng thanh toán với trạng thái khởi tạo `REFUND_PENDING`.

---

## 5. Mô hình Hóa Đơn hàng & Thanh toán (Order, Payment & Gateway Integration)

### 5.1. Phân định Trạng thái Đơn hàng, Thanh toán & Vòng đời Hoàn tiền
Đơn hàng phân tách độc lập các trạng thái:
- `orderStatus`: `"PENDING"`, `"CONFIRMED"`, `"PROCESSING"`, `"SHIPPED"`, `"DELIVERED"`, `"CANCELLED"`, `"EXPIRED"`.
- `paymentStatus`: `"UNPAID"`, `"PENDING_GATEWAY"`, `"PAID"`, `"FAILED"`, `"EXPIRED"`, `"PAID_LATE"`, `"REFUND_PENDING"`, `"REFUNDED"`, `"REFUND_FAILED"`.

### 5.2. Vòng đời Hoàn tiền Chi tiết (Refund Lifecycle)
Hệ thống chuẩn hóa cấu trúc và vòng đời hoàn tiền đơn (`payment.refund`):

```json
{
  "refund": {
    "refundId": "UUID",
    "idempotencyKey": "UUID",
    "gatewayRefundId": null,
    "amount": "Decimal128",
    "status": "REFUND_PENDING",
    "reason": "CUSTOMER_REQUEST",
    "requestedAt": "Date",
    "processedAt": null,
    "retryCount": 0,
    "lastError": null
  }
}
```

Các quy tắc vòng đời và kiểm soát an toàn:
1. `REFUND_PENDING`: Backend tạo giao dịch hoàn tiền, sinh `refundId` và `idempotencyKey` duy nhất, lưu vào database với `status = "REFUND_PENDING"`, sau đó gửi request sang cổng thanh toán (VNPAY / MoMo).
   - **Chống gửi trùng lặp:** Partial Unique Index trên `payment.refund.idempotencyKey` đảm bảo mỗi yêu cầu hoàn tiền chỉ được sinh ra đúng một lần.
2. `REFUNDED`: Cổng thanh toán xử lý thành công và phản hồi mã giao dịch `gatewayRefundId`.
   - **Chống xử lý trùng callback & Phân tích Tính Duy nhất của `gatewayRefundId`:**
     - *Bản chất kỹ thuật:* `gatewayRefundId` là mã giao dịch do cổng thanh toán (VNPAY/MoMo) phát hành. Giá trị này **chỉ đảm bảo duy nhất trong phạm vi từng cổng thanh toán (Locally Unique per Provider)**, hoàn toàn không có cam kết duy nhất toàn cầu (Globally Unique) giữa hai cổng độc lập (VNPAY vs MoMo).
     - *Chỉ mục cơ sở v1.2.1:* Duy trì Partial Unique Index hiện tại `idx_orders_refund_gateway_tx_unique` trên `{ "payment.refund.gatewayRefundId": 1 }` với `{ partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } } }` theo đúng hợp đồng kỹ thuật đã thống nhất.
     - *Đề xuất Kiến trúc Tối ưu (Zero-Collision Guarantee):* Khi tích hợp thực tế đa cổng, khuyến nghị áp dụng **Namespace Prefixing** tại tầng ứng dụng: `gatewayRefundId = gatewayName + ":" + rawGatewayId` (ví dụ `"VNPAY:14567890"`), hoặc nâng cấp lên **Compound Partial Unique Index**: `{ "payment.gatewayName": 1, "payment.refund.gatewayRefundId": 1 }` có điều kiện `{ "payment.refund.gatewayRefundId": { $type: "string" } }`.
   - > [!IMPORTANT]
     > **Tuyệt đối không chuyển trạng thái `REFUNDED` ngay khi chỉ vừa gửi request!** Trạng thái chỉ được ghi nhận `REFUNDED` khi đã nhận được xác nhận thành công từ API response hoặc Webhook IPN của cổng thanh toán.
3. `REFUND_FAILED`: Cổng thanh toán từ chối hoặc giao dịch bị lỗi (tài khoản khách lỗi, timeout mạng ngoài).
   - > [!NOTE]
     > **Phân định rõ Triển khai Code vs Đề xuất Nghiệp vụ Chờ Phê duyệt:**
     > - **Đã hoàn thiện & Sẵn sàng Triển khai Code:** Cấu trúc 10 trường của `payment.refund`, Finite State Machine (`REFUND_PENDING` $\rightarrow$ `REFUNDED` / `REFUND_FAILED`), Partial Unique Indexes, và cơ chế phát sự kiện domain (`OrderRefundRequestedEvent`, `OrderRefundFailedEvent`).
     > - **Thiết kế Kỹ thuật Linh hoạt (Strategy Pattern):** Tham số thử lại được trừu tượng hóa qua Spring Boot `@ConfigurationProperties(prefix = "app.payment.refund")` kết hợp interface `RefundRetryPolicy` và `AccountingReconciliationNotifier`. Thiết kế này cho phép mã nguồn không phụ thuộc cứng vào quyết định nghiệp vụ, có thể điều chỉnh cấu hình bất cứ lúc nào qua `application.yml` mà không phải sửa code.
     > - **Các Thông số TIẾP TỤC GIỮ TRẠNG THÁI CHỜ PHÊ DUYỆT (PENDING BUSINESS APPROVAL):**
     >   1. *Số lần thử lại tối đa:* Đề xuất 3 lần (`maxRetries = 3`) — **CHƯA PHÊ DUYỆT**.
     >   2. *Thuật toán giãn cách:* Đề xuất Exponential Backoff (1 phút, 5 phút, 15 phút) — **CHƯA PHÊ DUYỆT**.
     >   3. *Quy trình Đối soát Thủ công:* Kênh tiếp nhận và SLA xử lý đối soát kế toán trong vòng 24 giờ làm việc — **CHƯA PHÊ DUYỆT**.
4. **Phạm vi Hoàn tiền v1.2.1 và Khả năng Mở rộng v2.0:**
   - **Giới hạn v1.2.1:** Chuẩn hóa trên **đối tượng đơn `payment.refund`** gắn liền với `orders`. Thiết kế này đáp ứng hoàn hảo các kịch bản MVP: hủy toàn bộ đơn hàng sau thanh toán, hoặc hoàn tiền tự động khi Late Webhook đến sau khi reservation hết hạn và kho đã hết hàng.
   - **Lộ trình Mở rộng v2.0 (Multiple Partial Refunds):** Khi mô hình kinh doanh mở rộng cho phép khách hàng trả hàng và hoàn tiền nhiều lần độc lập trên cùng một đơn hàng, đối tượng đơn `payment.refund` sẽ được nâng cấp thành mảng các phiên hoàn tiền `payment.refunds: Array<Object>`, kết hợp với trạng thái tổng hợp dòng tiền trên `orders.paymentStatus` (`PARTIALLY_REFUNDED`, `FULLY_REFUNDED`).

### 5.3. Xác thực Chữ ký Cổng Thanh toán (Payment Gateway Signature Verification)
> [!WARNING]
> **Không giả định một thuật toán chung:** Mỗi cổng thanh toán có cơ chế bảo mật và thuật toán ký hoàn toàn riêng biệt. Tuyệt đối không giả định VNPAY và MoMo dùng chung thuật toán, chuỗi canonical payload hay thứ tự tham số.

- **VNPAY:**
  - Bắt buộc tuân thủ đúng tài liệu đặc tả chính thức của VNPAY (VNPAY API Specification theo phiên bản tích hợp cụ thể, ví dụ v2.1.0).
  - Chuỗi dữ liệu ký được tạo từ các tham số bắt đầu bằng `vnp_`, sắp xếp theo thứ tự bảng chữ cái (alphabetical order), mã hóa URL và loại bỏ `vnp_SecureHash`, `vnp_SecureHashType` trước khi băm kiểm tra với checksum key.
- **MoMo:**
  - Bắt buộc tuân thủ đúng tài liệu đặc tả chính thức của MoMo (MoMo Payment API Specification theo phiên bản tích hợp cụ thể, ví dụ v2).
  - Chuỗi dữ liệu ký được tạo từ các trường theo thứ tự cố định nghiêm ngặt do MoMo quy định (ví dụ: `accessKey`, `amount`, `extraData`, `ipnUrl`, `orderId`, `orderInfo`, `partnerCode`, `redirectUrl`, `requestId`, `requestType`) trước khi ký HMAC với secret key.
- **Quy tắc Bất biến:** Mọi xử lý nghiệp vụ thanh toán (cập nhật đơn hàng, xác nhận kho) **chỉ được thực thi sau khi Signature Verifier của cổng tương ứng xác thực chữ ký thành công 100%**.

### 5.4. Không Lồng Gọi Cổng Thanh toán Trong MongoDB Transaction
Khẳng định quy tắc kiến trúc 2 pha: **Tuyệt đối không thực hiện cuộc gọi HTTP ra cổng thanh toán bên trong MongoDB Transaction**. Giao dịch nội bộ chỉ dùng để trừ kho và tạo đơn `PENDING` (<20ms). Lời gọi thanh toán mạng ngoài diễn ra độc lập sau khi transaction nội bộ đã commit thành công.

---

## 6. Chiến lược Dữ liệu cho AI: Multi-version Embeddings & Zero-downtime Migration

```
               +------------------------------------------------+
               |                    products                    |
               +-----------------------+------------------------+
                                       | 1:0..N (Multi-version)
                                       v
               +------------------------------------------------+
               |               product_embeddings               |
               +------------------------------------------------+
               | - productId: ObjectId                          |
               | - modelVersion: "text-embedding-3-small-v1"    |
               | - isActive: true                               |
               | - embeddingStatus: "COMPLETED"                 |
               | - dimension: 1536                              |
               | - vector: [0.0123, -0.0456, ...]               |
               | - metadata: { categorySlug, salePriceVnd,... } |
               +------------------------------------------------+
```

### 6.1. Hỗ trợ Nhiều Phiên bản Embedding (Quan hệ 1:0..N)
- Một sản phẩm có thể có **nhiều bản ghi embedding** tương ứng với các mô hình hoặc phiên bản khác nhau (`modelVersion`).
- Quan hệ logic giữa `products` và `product_embeddings` là **`1:0..N`** (One to Zero-or-Many).
- **Chỉ mục Duy nhất Kép (Dual Unique Constraint):**
  1. `{ productId: 1, modelVersion: 1 }`: Đảm bảo với mỗi phiên bản mô hình, một sản phẩm chỉ có tối đa một vector biểu diễn (Unique Compound Index).
  2. `{ productId: 1 }` với `partialFilterExpression: { isActive: true }`: **Đảm bảo mỗi sản phẩm chỉ có TỐI ĐA MỘT embedding active** tại bất kỳ thời điểm nào (Partial Unique Index `uniq_active_embedding_per_product`).

---

### 6.2. Cơ chế Quản lý Phiên bản Embedding Cấp Hệ thống (Embedding Release Management)

> [!IMPORTANT]
> **Giới hạn của Partial Unique Index:**  
> Partial Unique Index `{ productId: 1 }` với `{ isActive: true }` trong `product_embeddings` **chỉ bảo đảm tính toàn vẹn ở cấp độ từng Product riêng lẻ** (mỗi sản phẩm không bị gắn 2 vector active cùng lúc). Nó **KHÔNG đảm bảo toàn bộ Product trong database sử dụng cùng một `modelVersion`**.  
> Nếu chỉ dựa vào chỉ mục này, hệ thống vẫn đối mặt với rủi ro split-brain: Product A có vector active của Model V1 (1536 chiều), trong khi Product B có vector active của Model V2 (1024 chiều). Khi truy vấn trên cùng một Atlas Vector Search Index, điều này sẽ làm sập hoặc sai lệch hoàn toàn kết quả tìm kiếm!

Để giải quyết triệt để rủi ro trên, hệ thống phân tách rõ hai khái niệm:
1. **`isActive` ở cấp độ từng Product:** Cờ boolean đánh dấu vector của sản phẩm cụ thể đã được tính toán hợp lệ và sẵn sàng phục vụ.
2. **Embedding Release Active ở cấp Toàn hệ thống:** Đối tượng định danh phiên bản phát hành chính thức đang điều phối hoạt động tìm kiếm của cả Backend và AI Service.

#### 6.2.1. Đánh giá Phương án Quản lý Nguồn Dữ liệu Đáng Tin cậy (SSOT Evaluation)

| Tiêu chí So sánh | Phương án 1: Config-driven SSOT (FastAPI Master + Spring Boot Handshake) | Phương án 2: Dedicated Metadata Collection (`embedding_releases`) |
| :--- | :--- | :--- |
| **Cơ chế lưu trữ** | Biến môi trường tập trung cấp phát cho FastAPI (hoặc ConfigMap); Spring Boot đọc qua endpoint `GET /api/v1/ai/model-info`. | Collection độc lập `embedding_releases` trong MongoDB lưu lịch sử phát hành. |
| **Số lượng Collection** | Không tạo thêm collection mới ($0$ collection). | Bổ sung thêm $1$ collection quản trị siêu nhẹ. |
| **Chống Split-Brain** | Đảm bảo qua nguyên tắc Single Master: Chỉ FastAPI quản lý phiên bản model & index, Backend chỉ là client tiêu thụ. | Đảm bảo tuyệt đối ở mức Database qua Partial Unique Index `{ status: "ACTIVE" }` (tối đa 1 active release toàn hệ sinh thái). |
| **Khả năng Kiểm toán & Rollback** | Cần theo dõi qua Git/CI-CD logs; rollback yêu cầu reload container cấu hình cũ. | Lưu vết đầy đủ: `releaseId`, `activatedAt`, `previousReleaseId`, `status`. Rollback thực thi tự động qua database query. |
| **Độ phức tạp Vận hành** | Đơn giản cho giai đoạn MVP ban đầu. | Chặt chẽ, chuẩn hóa Enterprise cho hệ thống phân tán dài hạn. |

**Quyết định Kiến trúc & Khuyến nghị:**
- **Nguyên tắc Bất biến:** Spring Boot và FastAPI **tuyệt đối không tự quản lý hai phiên bản active độc lập**.
- **Cấu trúc Dữ liệu Chuẩn của Embedding Release Metadata:** Dù lưu trữ dưới dạng Collection `embedding_releases` hay In-memory Registry tại FastAPI Master, đối tượng Release bắt buộc phải chứa đầy đủ 8 trường thông tin:
  ```json
  {
    "releaseId": "emb-rel-20261115-01",
    "model": "text-embedding-3-small",
    "modelVersion": "text-embedding-3-small-v1",
    "dimensions": 1536,
    "vectorIndexName": "idx_vector_search_text_embedding_3_small_1536",
    "targetCategory": "laptop",
    "status": "ACTIVE",
    "activatedAt": "2026-11-15T09:00:00.000Z",
    "rolledBackAt": null,
    "previousReleaseId": null
  }
  ```
  *(Các trạng thái `status`: `"STAGING"`, `"SHADOW"`, `"ACTIVE"`, `"RETIRED"`, `"ROLLED_BACK"`).*
- **Ràng buộc Database nếu dùng Collection `embedding_releases`:**
  ```javascript
  db.embedding_releases.createIndex(
    { status: 1 },
    { unique: true, partialFilterExpression: { status: "ACTIVE" }, name: "uniq_system_active_embedding_release" }
  );
  ```
- **Ràng buộc Tương thích Số chiều (Dimension Compatibility):**
  - Số chiều của Query Vector do FastAPI sinh ra bắt buộc phải khớp $100\%$ với số chiều trong Atlas Vector Search Index.
  - Quy ước đặt tên bất biến gắn chặt model và dimension: `idx_vector_search_<model_slug>_<dimensions>`.

---

### 6.3. Xác định Phạm vi Dữ liệu Embedding & Cơ chế Fallback Tìm kiếm

Giai đoạn AI đầu tiên của dự án Smart E-commerce AI tập trung độc quyền vào danh mục **Laptop**. Do đó, quy định về dữ liệu embedding được phân định chặt chẽ như sau:

#### 6.3.1. Phân biệt Số lượng Sản phẩm Catalog vs Phạm vi Đủ điều kiện Sinh Vector
- $N_{\text{total}}$: Tổng số sản phẩm toàn sàn (bao gồm Laptop, Phone, Tablet, Accessories).
- $N_{\text{laptop}}$: Tổng số sản phẩm danh mục Laptop.
- **$N_{\text{eligible}}$ (Tập Sản phẩm Đủ điều kiện Sinh Vector Phase 1):**
  $$N_{\text{eligible}} = \{ p \in \text{products} \mid p.\text{categorySlug} == \text{"laptop"} \land p.\text{status} == \text{"ACTIVE"} \land p.\text{isDeleted} == \text{false} \}$$
- **Quy tắc Nghiệp vụ Cốt lõi:**
  - Tiêu chí hoàn thành $100\%$ embedding chỉ tính trên tập **$N_{\text{eligible}}$**.
  - Tuyệt đối **không bắt buộc** Phone, Tablet, Accessories phải có embedding trong giai đoạn này. Các danh mục này không sinh document trong `product_embeddings` để tiết kiệm chi phí gọi API và tài nguyên RAM của search node.

#### 6.3.2. Xử lý Sản phẩm Thiếu Embedding & Cơ chế Fallback sang Keyword Search
- Nếu một sản phẩm Laptop mới tạo chưa kịp sinh vector (`embeddingStatus == "PENDING"`) hoặc sinh vector thất bại (`embeddingStatus == "FAILED"`):
  - Sản phẩm này **tuyệt đối không bị biến mất khỏi hệ thống tìm kiếm**.
  - **Cơ chế Fallback Tìm kiếm Tự nhiên (Keyword Search Fallback):**
    Backend Spring Boot duy trì thuật toán tìm kiếm kết hợp:
    $$\text{Search Pipeline} = \text{Atlas Vector Search (Laptop có Active Vector)} \cup \text{MongoDB Text Search (Keyword Fallback)}$$
    Câu lệnh tìm kiếm văn bản truyền thống trên MongoDB Text Index `idx_products_text_search` (`{ name: "text", tags: "text", shortDescription: "text" }`) đóng vai trò lưới an toàn (safety net), đảm bảo khách hàng vẫn tìm thấy sản phẩm thông qua tên máy, mã SKU hoặc thông số phần cứng.

---

### 6.4. Blue-Green Migration Runbook 9 Giai đoạn & Xử lý Cửa sổ Lỗi

> [!WARNING]
> **Khẳng định Bản chất Kiến trúc:** Toàn bộ quy trình chuyển đổi mô hình AI diễn ra trên 4 ranh giới hệ thống độc lập:
> 1. *MongoDB Document Transaction:* Đảo cờ `isActive: false/true` trong `product_embeddings` và cập nhật release.
> 2. *Trạng thái Atlas Vector Search Index:* Lucene index build bất đồng bộ trên các search node của MongoDB Atlas.
> 3. *Cấu hình AI Service (FastAPI):* Tiến trình sinh vector trong bộ nhớ và worker reload.
> 4. *Định tuyến Truy vấn Spring Boot:* Logic điều hướng search query từ client đến service tương ứng.
> Do đó, **tuyệt đối không tuyên bố quy trình này là atomic xuyên hệ thống**. Hệ thống áp dụng quy trình 9 giai đoạn điều phối nghiêm ngặt.

```
[GĐ 1: Gen Embeddings] ──> [GĐ 2: Verify Gate] ──> [GĐ 3: Build Index] ──> [GĐ 4: Index Ready] ──> [GĐ 5: Shadow Test]
                                                                                                          │
[GĐ 9: Rollback]       <── [GĐ 8: Health Check] <── [GĐ 7: Cutover Thống nhất] <── [GĐ 6: Compatibility] <┘
```

#### Chi tiết 9 Giai đoạn Vận hành Chuẩn:
1. **Giai đoạn 1: Generate Embedding cho phiên bản mới:**
   - Tạo các document vector mới với `modelVersion = "bge-m3-v1"`, `isActive = false`, `embeddingStatus = "PENDING"`.
   - AI Worker quét danh sách $N_{\text{eligible}}$ và gọi mô hình tính toán vector nền.
2. **Giai đoạn 2: Xác minh số lượng Embedding thành công và thất bại (Verification Gate):**
   - Đếm thống kê: Kiểm tra $\text{count}(\text{COMPLETED}) == N_{\text{eligible}}$ và $\text{count}(\text{FAILED}) == 0$.
   - **Hard Gate:** Nếu có bất kỳ sản phẩm nào bị lỗi hoặc chưa hoàn thành, quy trình dừng lại để retry worker xử lý. Tuyệt đối không chuyển sang Giai đoạn 3 khi chưa đạt $100\%$ Laptop Active.
3. **Giai đoạn 3: Xây dựng Atlas Vector Search Index:**
   - Tạo index mới trên MongoDB Atlas: `idx_vector_search_bge_m3_1024` (1024 chiều, cosine similarity, filter `metadata.categorySlug: "laptop"`).
4. **Giai đoạn 4: Xác nhận Index đã sẵn sàng (Index Readiness Gate):**
   - Polling trạng thái qua MongoDB Atlas Admin API.
   - **Hard Gate:** Bắt buộc trạng thái đạt `"STEADY"` / `"READY"`. Nếu trạng thái đang là `BUILDING` hoặc `FAILED`, hoãn quy trình, tuyệt đối không cutover.
5. **Giai đoạn 5: Chạy Shadow Testing:**
   - AI Service gửi query thực tế ngầm song song vào cả index cũ và mới.
   - Đánh giá chỉ số liên quan (NDCG@10, MRR) và độ trễ p95. Nếu chất lượng giảm hoặc độ trễ vượt SLA, hủy bỏ đợt cutover mà không ảnh hưởng người dùng.
6. **Giai đoạn 6: Kiểm tra sự tương thích giữa Model, Dimensions và Index (Pre-cutover Audit):**
   - Sanity check khớp 100%: $\text{FastAPI Target Dimension (1024)} == \text{Atlas Index Dimension (1024)}$.
7. **Giai đoạn 7: Cutover có cơ chế điều phối thống nhất (Coordinated Cutover):**
   - *Bước 7.1 (FastAPI Cutover):* Reload cấu hình FastAPI chuyển encoder sang model mới và trỏ câu lệnh query sang index mới `idx_vector_search_bge_m3_1024`.
   - *Bước 7.2 (MongoDB Document Transaction):*
     Mở MongoDB Transaction thực hiện đồng thời:
     - Đặt release cũ `status = "RETIRED"`, release mới `status = "ACTIVE"`.
     - Cập nhật `product_embeddings`: model cũ `isActive = false`, model mới `isActive = true`.
     - Commit transaction (đảm bảo tính nguyên tử nội bộ MongoDB).
8. **Giai đoạn 8: Health Check sau Cutover:**
   - Spring Boot thực hiện Handshake qua `GET /api/v1/ai/model-info` để kiểm tra tính nhất quán.
   - Bắn probe queries kiểm tra end-to-end kết quả tìm kiếm ngữ nghĩa Laptop.
9. **Giai đoạn 9: Rollback nếu phát hiện lỗi:**
   - Nếu tỷ lệ exception tăng cao hoặc kết quả sai lệch:
     1. API Gateway / Spring Boot hạ routing weight của Vector Search về 0%, tạm thời fallback 100% sang Keyword Search.
     2. Chạy Compensating Transaction trên MongoDB: Khôi phục release cũ sang `ACTIVE`, đảo lại cờ `isActive = true` cho model cũ trong `product_embeddings`.
     3. Revert cấu hình FastAPI trỏ về model và index cũ.
   - *Lưu ý quan trọng:* **Không đưa ra cam kết thời gian rollback cố định dưới 30 giây** khi chưa có kết quả đo kiểm thực tế trên môi trường Staging/Production.

---

#### Phân tích Cửa sổ Lỗi (Failure Windows) & Phục hồi Khi Tiến trình Dừng Giữa chừng:

| Cửa sổ Lỗi | Điểm Gãy (Failure Point) | Hậu quả nếu không xử lý | Cơ chế Khắc phục & Phục hồi |
| :--- | :--- | :--- | :--- |
| **Cửa sổ 1** | Script cutover bị crash tại Bước 7.1 (khi FastAPI đang rolling reload). | Một số worker FastAPI chạy model mới, một số chạy model cũ; MongoDB Transaction chưa chạy. | Script điều phối bắt tín hiệu process failure và tự động kích hoạt reload container FastAPI về image/cấu hình của model cũ. Hệ thống duy trì an toàn trên phiên bản cũ. |
| **Cửa sổ 2** | MongoDB Transaction tại Bước 7.2 bị `WriteConflict` hoặc rớt mạng khi commit. | MongoDB Transaction tự động `abortTransaction()`. Trạng thái database giữ nguyên vẹn 100% cho model cũ. | Compensating script lập tức reload lại FastAPI trỏ về model cũ. Không có hiện tượng split-brain. |
| **Cửa sổ 3** | MongoDB Transaction đã commit thành công nhưng tiến trình bị crash trước khi ghi nhận xong log. | Database đã kích hoạt release mới (`ACTIVE`), FastAPI đã chạy model mới, nhưng log chưa hoàn tất. | Khi script phục hồi chạy lại, nó kiểm tra trạng thái SSOT trong MongoDB (`status == "ACTIVE"`). Nhận thấy release mới đã commit, script xác nhận thành công và chuyển thẳng sang Giai đoạn 8 (Health Check), không làm gián đoạn hệ thống. |

---

## 7. Mô hình Dữ liệu Hành vi & Gợi ý (Event Tracking & Recommendation)

### 7.1. Phân tách Dữ liệu Nóng và Dài hạn
- Dữ liệu thô (`user_events`): Lưu trữ 90 ngày bằng TTL Index.
- Dữ liệu tổng hợp dài hạn (`user_preference_profiles`): Lưu trữ vĩnh viễn cho từng tài khoản, được cập nhật qua tiến trình Roll-up Aggregation hàng đêm. Quan hệ giữa `users` và `user_preference_profiles` là **`1:0..1`** (chỉ sinh ra sau khi tài khoản có đủ dữ liệu hành vi).

### 7.2. Định danh Duy nhất Impression Item & Chống Đếm Click Trùng
- Mỗi sản phẩm hiển thị trong khối gợi ý được gắn mã định danh duy nhất:
  $$\text{impressionItemId} = \text{impressionId} + \text{"\_"} + \text{productId} + \text{"\_"} + \text{position}$$
- **Chống Đếm Click Trùng (Click Deduplication):**
  - Khi người dùng bấm nhiều lần vào cùng một sản phẩm trong một lượt hiển thị, hệ thống tính toán CTR chỉ ghi nhận **click đầu tiên** hợp lệ trong Attribution Window (30 phút cho Click, 24 giờ cho Purchase).

### 7.3. Ghép phiên Khách Vãng lai (Session Stitching) Không Cần Collection Mới
- Không tạo collection riêng gây phân mảnh dữ liệu.
- Lưu trữ danh sách phiên liên kết ngay trong document `users` qua mảng giới hạn:
  `linkedSessionIds: Array<String>` (tối đa 10 phiên duyệt web gần nhất).
- Khi người dùng đăng nhập, thêm `sessionId` hiện tại vào `linkedSessionIds`. Tiến trình Roll-up Aggregation hàng đêm sẽ gom nhóm sự kiện theo điều kiện:
  `{ $or: [ { userId: currentUserId }, { sessionId: { $in: user.linkedSessionIds } } ] }`.

---

## 8. Thiết kế Giỏ hàng Yêu cầu Xác thực (Authentication Required for Cart)

> [!IMPORTANT]
> **Quyết định Nghiệp vụ ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT:**  
> Hệ thống thay thế hoàn toàn phương án Guest Cart / Cart Merge trước đây. **Chỉ người dùng đã đăng nhập mới được thêm sản phẩm vào giỏ hàng.**

### 8.1. Trải nghiệm Khách vãng lai và Người dùng Xác thực
- **Người dùng chưa đăng nhập (Unauthenticated Guests):**
  - Có toàn quyền truy cập website, xem danh sách sản phẩm, xem chi tiết sản phẩm, tìm kiếm và lọc danh mục.
  - Khi nhấn nút "Thêm vào giỏ hàng":
    - **Tuyệt đối không tạo Guest Cart**, không lưu sản phẩm vào giỏ hàng tạm thời hay cookie/localStorage.
    - Giao diện hiển thị thông báo yêu cầu người dùng đăng nhập (hoặc chuyển hướng sang trang đăng nhập).
    - Sau khi đăng nhập thành công, người dùng có thể quay lại trang sản phẩm để tiếp tục thao tác thêm vào giỏ.
- **Người dùng đã đăng nhập (Authenticated Users):**
  - Mỗi tài khoản có đúng **một giỏ hàng duy nhất** gắn liền với `userId` (Quan hệ logic `users` $\rightarrow$ `carts` là **`1:0..1`**).
  - Người dùng có toàn quyền thêm sản phẩm, cập nhật số lượng (từ 1 đến 10 sản phẩm/item) và xóa sản phẩm khỏi giỏ hàng.

### 8.2. Loại bỏ Hoàn toàn Phương án Guest Cart & Cart Merge
Theo quyết định phê duyệt chính thức, hệ thống **không triển khai**:
- Khái niệm giỏ hàng `GUEST` hay enum `GUEST_CART`.
- Lưu trữ giỏ hàng theo `sessionId`.
- Thao tác gộp giỏ hàng (Cart Merge) khi đăng nhập.
- Partial Unique Index cho Guest Cart.
- Logic xử lý xung đột số lượng và tồn kho giữa Guest Cart và User Cart.

### 8.3. Nguyên tắc Quản lý Tồn kho & Bảo mật Giỏ hàng
- **Giỏ hàng không tự động giữ kho (No Auto-reservation):** Thêm sản phẩm vào giỏ hàng chỉ thể hiện dự định mua sắm của khách hàng, **tuyệt đối không tạo reservation tồn kho**.
- **Kiểm tra Tồn kho Thực tế khi Checkout:** Việc kiểm tra tồn kho khả dụng ($\text{quantity} - \text{reserved} \ge \text{requestedQty}$) và tạo reservation chỉ được kích hoạt khi khách hàng tiến hành bước Checkout.
- **Ràng buộc Duy nhất & Giới hạn Sản phẩm:** Mỗi sản phẩm chỉ xuất hiện tối đa một lần trong mảng `items`. Nếu thêm sản phẩm đã có trong giỏ, hệ thống tự động tăng `quantity` (tối đa 10/item) thay vì thêm item trùng. Toàn bộ giỏ hàng cho phép tối đa 50 items.
- **Bảo mật Xác thực Danh tính (Identity Enforcement):** Backend Spring Boot trích xuất `userId` trực tiếp từ JWT Access Token / Security Context của người dùng đã xác thực, tuyệt đối không tin cậy `userId` do Client tự truyền trong payload request nhằm chống giả mạo danh tính giỏ hàng.
- **Loại bỏ TTL Index 30 ngày:** Chính sách tự động hết hạn hoặc xóa Cart chưa được phê duyệt và chưa triển khai trong phiên bản hiện tại. Toàn bộ trường `expiresAt` và TTL Index trên `carts` đã được loại bỏ. Giỏ hàng lưu trữ bền vững theo tài khoản người dùng.
- **Độc lập với AI Tracking:** Quyết định này không ảnh hưởng đến cơ chế Session Stitching phục vụ AI Recommendation. Trường `users.linkedSessionIds` vẫn được duy trì độc lập trong collection `users` để theo dõi các sự kiện duyệt web và tìm kiếm của khách vãng lai trước thời điểm đăng nhập.

---

## 9. Đánh giá Sản phẩm & Atomic Update Rating Summary

> [!IMPORTANT]
> **Chính sách Đánh giá (Review Policy - ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT):**  
> 1. Mỗi người dùng chỉ có duy nhất 1 đánh giá đang hoạt động (`status: { $in: ["PENDING", "APPROVED"] }`) cho mỗi sản phẩm. Cho phép tạo đánh giá mới nếu đánh giá cũ đã bị xóa mềm (`status: "DELETED"`).  
> 2. Đơn hàng bắt buộc phải ở trạng thái `DELIVERED` và `PAID`.  
> 3. **Kiểm tra chi tiết từng order item theo số lượng:** Quản lý bằng `returnedQuantity` và `refundedQuantity`. Khách hàng chỉ được phép đánh giá khi số lượng thực tế giữ lại $\text{quantity} - \text{returnedQuantity} > 0$ (tức $\text{returnedQuantity} < \text{quantity}$). Nếu khách đã trả lại toàn bộ ($\text{returnedQuantity} == \text{quantity}$), hủy quyền đánh giá. Loại bỏ hoàn toàn các cờ Boolean `isReturned` và `isRefunded`.  
> 4. `ratingSummary` trên sản phẩm chỉ tổng hợp từ các đánh giá đã duyệt (`status == "APPROVED"`), cập nhật concurrency an toàn và có cơ chế batch recomputation/reconciliation định kỳ.

- **Kiểm thực Verified Purchase Chặt chẽ:** Đơn hàng phải thỏa mãn đồng thời: `orderStatus == "DELIVERED"`, `paymentStatus == "PAID"`, và `paymentStatus != "REFUNDED"`. Ở cấp độ từng sản phẩm, hệ thống xét theo số lượng thực nhận giữ lại ($\text{returnedQuantity} < \text{quantity}$), đảm bảo việc trả hàng một phần không tước đoạt quyền đánh giá đối với các sản phẩm khách thực tế vẫn giữ lại và sử dụng.
- **Cập nhật `ratingSummary` Tránh Race Condition khi Duyệt Đồng thời:**
  - Nếu duyệt lẻ từng review: Dùng công thức cập nhật gia số an toàn.
  - Khi duyệt hàng loạt (Batch Approval): Thay vì cập nhật gia số dễ bị race condition, hệ thống sử dụng Aggregation Pipeline để **tính toán lại tức thời (Atomic Recompute)** từ các review đã duyệt (`status == "APPROVED"`):
    ```javascript
    db.product_reviews.aggregate([
      { $match: { productId: targetProductId, status: "APPROVED" } },
      { $group: { _id: "$productId", count: { $sum: 1 }, average: { $avg: "$rating" } } }
    ]);
    ```
    và ghi đè kết quả chuẩn xác vào `products.ratingSummary`. Định kỳ có Batch Reconciliation Worker kiểm tra và cân bằng dữ liệu đánh giá trên toàn bộ catalog.

---

## 10. Hành vi Thực tế của MongoDB TTL Indexes

> [!WARNING]
> TTL Monitor chạy ngầm mỗi 60 giây và có thể bị trễ dưới tải cao. Các câu lệnh truy vấn nghiệp vụ của Backend bắt buộc phải có điều kiện lọc thời gian tường minh: `expiresAt: { $gt: new Date() }`.
