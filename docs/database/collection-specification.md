# Database Specification v1.2.1: Đặc tả Chi tiết Collections
**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect  
**Phiên bản:** 1.2.1 (Technical Consistency & Refinement Edition)  
**Ngày cập nhật:** 15/11/2026  

---

## Danh mục Collections Hệ thống (14 Collections)

| Phân hệ | Tên Collection | Mục đích chính |
| :--- | :--- | :--- |
| **Core** | `users` | Quản lý tài khoản, quyền hạn, sổ địa chỉ và mảng `linkedSessionIds` |
| | `categories` | Phân cấp danh mục sản phẩm (Laptop, Phone, Tablet, Accessories) |
| | `brands` | Thương hiệu công nghệ đối tác (Dell, Apple, Asus, Lenovo,...) |
| | `products` | Thông tin sản phẩm, tồn kho hai mức (`quantity`, `reserved`) và thông số đa hình |
| | `product_embeddings` | Vector embeddings đa phiên bản (Quan hệ 1:0..N, `isActive`, Unique `{productId, modelVersion}`) |
| | `carts` | Giỏ hàng người dùng xác thực (Quan hệ 1:0..1 với users, Unique `{ userId: 1 }`) |
| | `orders` | Đơn hàng, snapshot giá lịch sử, `idempotencyKey`, trạng thái kép, vòng đời hoàn tiền |
| **Interaction** | `product_reviews` | Đánh giá sao, kiểm thực Verified Purchase, Partial Unique Index hỗ trợ Soft-Delete |
| | `user_events` | Luồng sự kiện clickstream (TTL 90 ngày) phục vụ Recommendation & CTR |
| | `user_preference_profiles`| Hồ sơ sở thích người dùng tích lũy dài hạn sau Roll-up (Quan hệ 1:0..1) |
| | `search_logs` | Nhật ký tìm kiếm từ khóa, bộ lọc và độ trễ truy vấn (TTL 90 ngày) |
| | `recommendation_logs` | Nhật ký hiển thị gợi ý mang `impressionItemId`, `position`, `experimentId` (TTL 60 ngày) |
| **AI Advisor** | `ai_conversations` | Phiên trò chuyện tư vấn bán hàng với AI |
| | `ai_messages` | Từng tin nhắn hỏi - đáp, token tiêu thụ và sản phẩm viện dẫn RAG |

---

## 1. Core Collections

### 1.1. Collection: `users`
- **Mục đích:** Quản lý thông tin tài khoản người dùng, phân quyền truy cập, danh sách địa chỉ giao hàng nhúng và danh sách phiên liên kết (`linkedSessionIds`) phục vụ Session Stitching không cần collection phụ.
- **Bảng đặc tả trường dữ liệu:**

| Tên trường | Kiểu BSON | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `_id` | `ObjectId` | Có | Khóa chính tự sinh |
| `email` | `String` | Có | Email duy nhất, viết thường, chuẩn RFC 5322 |
| `passwordHash` | `String` | Có | Mật khẩu băm an toàn (BCrypt / Argon2id) |
| `fullName` | `String` | Có | Họ và tên khách hàng (2 - 100 ký tự) |
| `phoneNumber` | `String` | Không | Số điện thoại liên hệ (10 chữ số chuẩn VN) |
| `role` | `String` | Có | `"ROLE_CUSTOMER"`, `"ROLE_ADMIN"`, `"ROLE_STAFF"` |
| `status` | `String` | Có | `"ACTIVE"`, `"LOCKED"`, `"PENDING_VERIFY"` |
| `addresses` | `Array<Object>`| Không | Danh sách địa chỉ giao hàng nhúng |
| `linkedSessionIds` | `Array<String>`| Không | Danh sách tối đa 10 `sessionId` vãng lai liên kết khi đăng nhập phục vụ Session Stitching |
| `lastLoginAt` | `Date` | Không | Thời điểm đăng nhập gần nhất |
| `createdAt` | `Date` | Có | Ngày tạo |
| `updatedAt` | `Date` | Có | Ngày cập nhật |

- **Document mẫu:**
```json
{
  "_id": { "$oid": "655b1a1f8e4b2c1a01234567" },
  "email": "customer.tech@gmail.com",
  "passwordHash": "$2a$12$e8Yy8F4z1aJ9f2pP7L...encryptedHash",
  "fullName": "Nguyễn Văn An",
  "phoneNumber": "0987654321",
  "role": "ROLE_CUSTOMER",
  "status": "ACTIVE",
  "addresses": [
    {
      "id": "addr_9a8b7c6d",
      "receiverName": "Nguyễn Văn An",
      "phoneNumber": "0987654321",
      "street": "Số 15 Tạ Quang Bửu",
      "ward": "Bách Khoa",
      "district": "Hai Bà Trưng",
      "province": "Hà Nội",
      "isDefault": true
    }
  ],
  "linkedSessionIds": [
    "sess_f47ac10b-58cc-4372-a567-0e02b2c3d479"
  ],
  "lastLoginAt": { "$date": "2026-11-15T08:30:00.000Z" },
  "createdAt": { "$date": "2026-10-01T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-11-15T08:30:00.000Z" }
}
```

---

### 1.2. Collection: `products`
- **Mục đích:** Quản lý sản phẩm với tồn kho hai mức (`quantity`, `reserved`), cờ `inStock` cập nhật nguyên tử và thông số đa hình `attributes`.
- **Ràng buộc Tiền tệ:** Giá `listPrice` và `salePrice` dùng `Decimal128`, không chứa phần thập phân (số nguyên VND).

---

### 1.3. Collection: `product_embeddings` (Hỗ trợ Nhiều Phiên bản — Quan hệ 1:0..N)
- **Mục đích:** Lưu trữ vector embedding cho sản phẩm. Hỗ trợ nhiều phiên bản vector model cùng tồn tại song song phục vụ Zero-downtime Migration.
- **Ràng buộc Duy nhất Kép (Dual Unique Constraint):**
  1. `{ productId: 1, modelVersion: 1 }`: Đảm bảo mỗi sản phẩm chỉ có tối đa một vector cho mỗi phiên bản model (Unique Compound Index).
  2. `{ productId: 1 }` với `partialFilterExpression: { isActive: true }`: **Bảo đảm mỗi sản phẩm chỉ có TỐI ĐA MỘT embedding active** tại một thời điểm (Partial Unique Index `uniq_active_embedding_per_product`).
- **Quy tắc Quản lý Cấp Hệ thống & Phạm vi Catalog Giai đoạn Đầu:**
  - *Phân định Active Product vs Active Hệ thống:* Partial Unique Index kiểm soát ở cấp product. Toàn hệ thống sử dụng cấu hình đồng bộ `ACTIVE_EMBEDDING_MODEL_VERSION` (FastAPI & Spring Boot) để đảm bảo toàn bộ query vector khớp số chiều với Atlas Vector Search Index (`idx_vector_search_<model>_<dim>`).
  - *Phạm vi Catalog Phase 1:* Chỉ áp dụng cho sản phẩm **Laptop** đang hoạt động (`metadata.categorySlug == "laptop"`, `status == "ACTIVE"`, `isDeleted == false`). Các danh mục Phone, Tablet, Accessories không sinh vector trong giai đoạn đầu và sử dụng tìm kiếm văn bản truyền thống.
- **Bảng đặc tả trường dữ liệu:**

| Tên trường | Kiểu BSON | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `_id` | `ObjectId` | Có | Khóa chính |
| `productId` | `ObjectId` | Có | Tham chiếu `products._id` |
| `modelVersion` | `String` | Có | Tên và phiên bản model (ví dụ: `"text-embedding-3-small-v1"`, `"bge-m3-v1"`) |
| `isActive` | `Boolean` | Có | Đánh dấu model/index vector đang kích hoạt phục vụ tìm kiếm |
| `embeddingStatus`| `String` | Có | `"PENDING"`, `"COMPLETED"`, `"FAILED"`, `"OUTDATED"` |
| `dimension` | `Int32` | Có | Số chiều vector (ví dụ: 1536 hoặc 1024) |
| `version` | `Int32` | Có | Phiên bản pipeline vector hóa (`1`, `2`,...) |
| `sourceUpdatedAt`| `Date` | Có | Đối chiếu `products.updatedAt` tại thời điểm sinh vector |
| `chunkText` | `String` | Có | Nội dung văn bản tổng hợp đưa vào model AI |
| `vector` | `Array<Double>`| Có | Mảng số thực chuẩn hóa độ dài Euclidean |
| `metadata` | `Object` | Có | Dữ liệu hỗ trợ Pre-filtering trong Atlas Vector Search |
| `metadata.categorySlug`| `String`| Có | Slug danh mục |
| `metadata.brandName` | `String` | Có | Tên thương hiệu |
| `metadata.salePriceVnd`| `Int64` | Có | **Giá tiền nguyên tệ VND dạng NumberLong** (không âm thầm làm tròn, lấy nguyên vẹn từ `salePrice` nguyên tệ) |
| `metadata.useCases` | `Array<String>`| Không | Danh sách nhu cầu sử dụng |
| `errorMessage` | `String` | Không | Ghi nhận lỗi nếu sinh vector thất bại |
| `retryCount` | `Int32` | Có | Số lần thử lại (tối đa 3 lần với Exponential Backoff) |
| `updatedAt` | `Date` | Có | Ngày cập nhật bản ghi vector |

- **Document mẫu:**
```json
{
  "_id": { "$oid": "655b1a238e4b2c1a01234571" },
  "productId": { "$oid": "655b1a228e4b2c1a01234570" },
  "modelVersion": "text-embedding-3-small-v1",
  "isActive": true,
  "embeddingStatus": "COMPLETED",
  "dimension": { "$numberInt": "1536" },
  "version": { "$numberInt": "1" },
  "sourceUpdatedAt": { "$date": "2026-11-15T09:00:00.000Z" },
  "chunkText": "Sản phẩm: Laptop Dell XPS 16 9640. CPU: Intel Core Ultra 7 155H. GPU: RTX 4060 8GB. RAM: 32GB LPDDR5X. Bộ nhớ: 1TB SSD. Màn hình: 16.3 inch OLED 3.2K 120Hz.",
  "/* Ghi chú: Dưới đây là 5 phần tử minh họa trong tổng số 1536 chiều */": true,
  "vector": [0.014210, -0.038102, 0.009415, 0.052190, -0.011832],
  "metadata": {
    "categorySlug": "laptop",
    "brandName": "Dell",
    "salePriceVnd": { "$numberLong": "62990000" },
    "useCases": ["CREATIVE_DESIGN", "DATA_AI", "GAMING", "OFFICE_LUXURY"]
  },
  "errorMessage": null,
  "retryCount": { "$numberInt": "0" },
  "updatedAt": { "$date": "2026-11-15T09:05:00.000Z" }
}
```

---

### 1.4. Collection: `carts`
- **Mục đích:** Quản lý giỏ hàng mua sắm của người dùng đã xác thực (Authenticated Users). Khách chưa đăng nhập không thể thêm sản phẩm vào giỏ hàng (theo Quyết định nghiệp vụ ĐÃ PHÊ DUYỆT).
- **Quy tắc Nghiệp vụ Giỏ hàng:**
  1. Chỉ người dùng đã đăng nhập mới sở hữu giỏ hàng (`userId` bắt buộc, Unique Index `{ userId: 1 }`, quan hệ `1:0..1`).
  2. Một Product chỉ được xuất hiện tối đa một lần trong mảng `items`. Khi thêm sản phẩm đã có trong giỏ, hệ thống tự động tăng `quantity` thay vì thêm subdocument trùng.
  3. Giới hạn giỏ hàng: Tối đa **50 items/cart**; số lượng mỗi item từ **1 đến 10**.
  4. Giỏ hàng không tự động giữ chỗ tồn kho (No Auto-reservation).
  5. **Chính sách Hết hạn:** Chính sách tự động hết hạn hoặc xóa Cart chưa được phê duyệt và chưa triển khai trong phiên bản hiện tại (loại bỏ trường `expiresAt` và TTL Index).
- **Bảng đặc tả trường dữ liệu:**

| Tên trường | Kiểu BSON | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `_id` | `ObjectId` | Có | Khóa chính |
| `userId` | `ObjectId` | Có | Tham chiếu `users._id` (Unique Index, quan hệ 1:0..1) |
| `items` | `Array<Object>`| Có | Danh sách sản phẩm trong giỏ (tối đa 50 items) |
| `items.$.productId` | `ObjectId` | Có | ID sản phẩm tham chiếu `products._id` |
| `items.$.quantity` | `Int32` | Có | Số lượng mua ($\ge 1$, giới hạn tối đa 10/item) |
| `items.$.addedAt` | `Date` | Có | Thời điểm thêm vào giỏ |
| `items.$.updatedAt` | `Date` | Không | Thời điểm cập nhật số lượng gần nhất |
| `createdAt` | `Date` | Có | Thời điểm khởi tạo giỏ hàng |
| `updatedAt` | `Date` | Có | Thời điểm tương tác giỏ gần nhất |

- **Document mẫu:**
```json
{
  "_id": { "$oid": "655b1a238e4b2c1a01234571" },
  "userId": { "$oid": "655b1a1f8e4b2c1a01234567" },
  "items": [
    {
      "productId": { "$oid": "655b1a208e4b2c1a01234568" },
      "quantity": { "$numberInt": "2" },
      "addedAt": { "$date": "2026-11-15T08:30:00.000Z" },
      "updatedAt": { "$date": "2026-11-15T08:35:00.000Z" }
    }
  ],
  "createdAt": { "$date": "2026-11-15T08:30:00.000Z" },
  "updatedAt": { "$date": "2026-11-15T08:35:00.000Z" }
}
```

---

### 1.5. Collection: `orders`
- **Mục đích:** Quản lý đơn hàng, snapshot giá và thông tin sản phẩm, `idempotencyKey`, trạng thái kép, quản lý nhiều lượt đặt trước (`reservationHistory`), và giao dịch hoàn tiền chuẩn hóa (`payment.refund`).
- **Phạm vi Hoàn tiền v1.2.1:** Chuẩn hóa trên đối tượng đơn `payment.refund` đại diện cho giao dịch hoàn tiền chính của đơn (hoàn tiền tự động khi Late Webhook hết hàng, hoặc hủy đơn hoàn tiền). Cấu trúc 10 trường dữ liệu và Finite State Machine đã hoàn thiện và sẵn sàng triển khai code. Các thông số retry (3 lần, Exponential Backoff, chuyển đối soát thủ công) là **Đề xuất kỹ thuật đang chờ phê duyệt nghiệp vụ (Pending Business Approval)** và được trừu tượng hóa qua cấu hình ứng dụng (`app.payment.refund.max-retries`). Kịch bản hỗ trợ nhiều lần hoàn tiền độc lập (Multiple Partial Refunds) được ghi nhận là giới hạn nghiệp vụ cần Business xác nhận khi mở rộng sang v2.0.
- **Bảng đặc tả trường dữ liệu:**

| Tên trường | Kiểu BSON | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `_id` | `ObjectId` | Có | Khóa chính |
| `orderCode` | `String` | Có | Mã hiển thị duy nhất (ví dụ: `"ORD-20261115-88F9"`) |
| `idempotencyKey` | `String` | Có | Khóa bất biến chống tạo đơn trùng lặp (Unique Index) |
| `userId` | `ObjectId` | Có | Tham chiếu `users._id` |
| `activeReservationId` | `String`| Có | UUID của phiên giữ hàng tồn kho hiện tại |
| `reservationStatus` | `String` | Có | `"PENDING"`, `"CONFIRMED"`, `"RELEASED"`, `"EXPIRED"` |
| `reservationHistory` | `Array<Object>`| Không | Lịch sử các đợt reservation (lưu vết khi có Late Webhook tạo reservation mới) |
| `orderStatus` | `String` | Có | `"PENDING"`, `"CONFIRMED"`, `"PROCESSING"`, `"SHIPPED"`, `"DELIVERED"`, `"CANCELLED"`, `"EXPIRED"` |
| `paymentStatus` | `String` | Có | `"UNPAID"`, `"PENDING_GATEWAY"`, `"PAID"`, `"FAILED"`, `"EXPIRED"`, `"PAID_LATE"`, `"REFUND_PENDING"`, `"REFUNDED"`, `"REFUND_FAILED"` |
| `shippingAddress` | `Object` | Có | Snapshot địa chỉ nhận hàng |
| `payment` | `Object` | Có | Chi tiết giao dịch thanh toán |
| `payment.method` | `String` | Có | `"COD"`, `"VNPAY"`, `"MOMO"`, `"BANK_TRANSFER"` |
| `payment.gatewayTransactionId`| `String`| Không| Mã giao dịch cổng (Partial Unique Index) |
| `payment.paidAt` | `Date` | Không | Thời điểm thanh toán thành công |
| `payment.refund` | `Object` | Không | Thông tin giao dịch hoàn tiền đơn |
| `payment.refund.refundId` | `String` | Không | UUID định danh phiên hoàn tiền |
| `payment.refund.idempotencyKey`| `String`| Không| Khóa bất biến gửi yêu cầu hoàn tiền chống trùng lặp (Partial Unique Index) |
| `payment.refund.gatewayRefundId`| `String`| Không| Mã giao dịch hoàn tiền trả về từ cổng VNPAY/MoMo (Partial Unique Index chống xử lý lặp callback; lưu ý chỉ duy nhất trong phạm vi từng cổng thanh toán) |
| `payment.refund.amount` | `Decimal128`| Không| Số tiền hoàn lại cho khách (chuẩn tiền tệ Decimal128) |
| `payment.refund.status` | `String` | Không | `"REFUND_PENDING"`, `"REFUNDED"`, `"REFUND_FAILED"` |
| `payment.refund.reason` | `String` | Không | Lý do hoàn tiền (ví dụ: `"LATE_WEBHOOK_OUT_OF_STOCK"`, `"CUSTOMER_REQUEST"`) |
| `payment.refund.requestedAt`| `Date` | Không| Thời điểm gửi yêu cầu hoàn tiền |
| `payment.refund.processedAt`| `Date` | Không| Thời điểm cổng xác nhận hoàn tiền thành công (null khi đang chờ) |
| `payment.refund.retryCount`| `Int32` | Không| Số lần thử lại hoàn tiền tự động (khởi tạo 0) |
| `payment.refund.lastError` | `String` | Không| Chi tiết lỗi trả về nếu cổng từ chối hoàn tiền |
| `items` | `Array<Object>`| Có | **Historic Snapshot items** |
| `items.$.productId` | `ObjectId` | Có | ID sản phẩm tại thời điểm mua |
| `items.$.sku` | `String` | Có | SKU sản phẩm |
| `items.$.productName` | `String` | Có | Tên sản phẩm snapshot |
| `items.$.unitPrice` | `Decimal128`| Có | Đơn giá tại thời điểm mua |
| `items.$.quantity` | `Int32` | Có | Tổng số lượng mua ban đầu ($\ge 1$) |
| `items.$.returnedQuantity` | `Int32` | Có | Số lượng hàng đã trả lại vật lý ($0 \le returnedQuantity \le quantity$) |
| `items.$.refundedQuantity` | `Int32` | Có | Số lượng hàng đã hoàn tiền tài chính ($0 \le refundedQuantity \le quantity$) |
| `items.$.totalPrice` | `Decimal128`| Có | Thành tiền item ($unitPrice \times quantity$) |
| `subtotal` | `Decimal128` | Có | Tổng tiền hàng |
| `shippingFee` | `Decimal128` | Có | Phí vận chuyển |
| `discountAmount` | `Decimal128` | Có | Giảm giá khuyến mãi |
| `grandTotal` | `Decimal128` | Có | Tổng thanh toán cuối cùng |
| `expiresAt` | `Date` | Có | Thời hạn thanh toán (mặc định 15 phút sau khi tạo đơn - APPROVED) |
| `createdAt` | `Date` | Có | Thời điểm đặt hàng |
| `updatedAt` | `Date` | Có | Thời điểm cập nhật cuối |

- **Document mẫu:**
```json
{
  "_id": { "$oid": "655b1a258e4b2c1a01234573" },
  "orderCode": "ORD-20261115-88F9",
  "idempotencyKey": "idemp_checkout_9f8e7d6c-5b4a-3210-9876-fedcba098765",
  "userId": { "$oid": "655b1a1f8e4b2c1a01234567" },
  "activeReservationId": "res_8a7b6c5d-4e3f-2109-8765-abcdef123456",
  "reservationStatus": "CONFIRMED",
  "reservationHistory": [
    {
      "reservationId": "res_8a7b6c5d-4e3f-2109-8765-abcdef123456",
      "status": "CONFIRMED",
      "createdAt": { "$date": "2026-11-15T10:12:00.000Z" }
    }
  ],
  "orderStatus": "PROCESSING",
  "paymentStatus": "PAID",
  "shippingAddress": {
    "receiverName": "Nguyễn Văn An",
    "phoneNumber": "0987654321",
    "fullAddress": "Số 15 Tạ Quang Bửu, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội"
  },
  "payment": {
    "method": "VNPAY",
    "gatewayTransactionId": "VNP142981023",
    "paidAt": { "$date": "2026-11-15T10:15:30.000Z" },
    "refund": null
  },
  "items": [
    {
      "productId": { "$oid": "655b1a228e4b2c1a01234570" },
      "sku": "DELL-XPS16-9640-U7",
      "productName": "Laptop Dell XPS 16 9640 Intel Core Ultra 7 155H 32GB 1TB RTX 4060 OLED",
      "thumbnailUrl": "https://cdn.store.com/products/dell-xps-16-front.webp",
      "unitPrice": { "$numberDecimal": "62990000" },
      "quantity": { "$numberInt": "1" },
      "returnedQuantity": { "$numberInt": "0" },
      "refundedQuantity": { "$numberInt": "0" },
      "totalPrice": { "$numberDecimal": "62990000" }
    }
  ],
  "subtotal": { "$numberDecimal": "62990000" },
  "shippingFee": { "$numberDecimal": "0" },
  "discountAmount": { "$numberDecimal": "1000000" },
  "grandTotal": { "$numberDecimal": "61990000" },
  "expiresAt": { "$date": "2026-11-15T10:27:00.000Z" },
  "createdAt": { "$date": "2026-11-15T10:12:00.000Z" },
  "updatedAt": { "$date": "2026-11-15T10:15:30.000Z" }
}
```

---

## 2. User Interaction & Tracking Collections

### 2.1. Collection: `product_reviews`
- **Mục đích:** Lưu trữ đánh giá của người dùng.
- **Trạng thái:** `"PENDING"`, `"APPROVED"`, `"REJECTED"`, `"DELETED"` (hỗ trợ Soft-Delete).
- **Quy tắc Index:** Partial Unique Index trên `{ userId: 1, productId: 1 }` với bộ lọc `status: { $in: ["PENDING", "APPROVED", "REJECTED"] }`.

---

### 2.2. Collection: `user_events`
- **Mục đích:** Lưu trữ luồng sự kiện clickstream (TTL 90 ngày).
- **Bổ sung các trường liên kết Recommendation & CTR:**
  - `metadata.impressionId`: UUID định danh phiên gợi ý liên kết.
  - `metadata.impressionItemId`: Mã định danh duy nhất của sản phẩm trong lượt hiển thị (`${impressionId}_${productId}_${position}`).
  - `metadata.position`: Vị trí index của sản phẩm trên giao diện ($0, 1, 2, ...$).
  - `metadata.algorithmVersion`: Phiên bản thuật toán.
  - `metadata.experimentId`: Mã thử nghiệm A/B Testing.
- **Cửa sổ Quy kết (Attribution Window):** Click trong vòng **30 phút** kể từ `impressionId`; Mua hàng trong vòng **24 giờ** kể từ click.

---

### 2.3. Collection: `user_preference_profiles` (Quan hệ 1:0..1 với Users)
- **Mục đích:** Lưu trữ hồ sơ sở thích tích lũy dài hạn sau quá trình Roll-up Aggregation hàng đêm.
- **Quan hệ:** **`1:0..1`** với `users` (chỉ tạo document sau khi user phát sinh đủ lịch sử tương tác).
- **Khóa chính logic:** `userId` (Unique Index).

---

### 2.4. Collection: `recommendation_logs`
- **Mục đích:** Ghi nhận lượt hiển thị gợi ý (Impression) phục vụ đo lường CTR và đánh giá thuật toán.
- **Bảng đặc tả trường dữ liệu:**

| Tên trường | Kiểu BSON | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `_id` | `ObjectId` | Có | Khóa chính |
| `impressionId` | `String` | Có | UUID định danh lượt hiển thị (Unique Index) |
| `sessionId` | `String` | Có | Định danh phiên |
| `userId` | `ObjectId` | Không | Định danh người dùng |
| `algorithmVersion`| `String` | Có | Phiên bản thuật toán (ví dụ: `"HYBRID_V2.1"`) |
| `experimentId` | `String` | Không | Mã thử nghiệm A/B Testing |
| `placement` | `String` | Có | `"HOME_PAGE"`, `"PRODUCT_DETAIL"`, `"CART"` |
| `items` | `Array<Object>`| Có | Danh sách sản phẩm được hiển thị kèm vị trí và ID định danh |
| `items.$.impressionItemId`| `String`| Có | Định danh duy nhất item trong hiển thị (`${impressionId}_${productId}_${position}`) |
| `items.$.productId` | `ObjectId` | Có | ID sản phẩm gợi ý |
| `items.$.position` | `Int32` | Có | Vị trí hiển thị trên thẻ giao diện ($0, 1, 2, ...$) |
| `createdAt` | `Date` | Có | Ngày tạo log (TTL 60 ngày) |

---

## 3. AI Advisor Collections
- Giữ nguyên cấu trúc phân tách `ai_conversations` và `ai_messages`.
