# Database Specification v1.2.1: Chiến lược Indexing Toàn diện (Index Strategy)
**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect  
**Phiên bản:** 1.2.1 (Technical Consistency & Refinement Edition)  
**Ngày cập nhật:** 15/11/2026  

---

## 1. Triết lý Indexing & Quản lý Bộ nhớ Đệm (Indexing Philosophy)

Trong MongoDB, Index sử dụng cấu trúc B-tree để tăng tốc độ truy vấn đọc từ $O(N)$ (Collection Scan) xuống $O(\log N)$ (Index Scan). Tuy nhiên, mỗi Index đều phải trả giá bằng tài nguyên:
- **Tốn dung lượng RAM:** Toàn bộ Working Set và Indexes nên nằm trọn vẹn trong WiredTiger Cache.
- **Chi phí ghi (Write Penalty):** Mỗi thao tác `insert`, `update`, `delete` đều buộc database phải cập nhật toàn bộ các cây index liên quan.

> [!IMPORTANT]
> **Quy tắc vàng thiết kế Index:**
> 1. Không tạo index dự phòng hoặc tràn lan.
> 2. Luôn áp dụng **Quy tắc ESR (Equality $\rightarrow$ Sort $\rightarrow$ Range)** khi xây dựng Compound Index.
> 3. Tận dụng **Partial Unique Index** với điều kiện lọc tường minh theo kiểu dữ liệu để xử lý các document rẽ nhánh (Active Reviews, Gateway Transaction Id, Refund Idempotency).
> 4. Hiểu rõ bản chất của **TTL Index:** Tiến trình TTL chạy ngầm mỗi 60 giây và không đảm bảo xóa chính xác tại tích tắc hết hạn.
> 5. Phân biệt rõ ràng giữa **Traditional B-tree Index** (MongoDB nội bộ) và **Atlas Vector Search Index** (Quản lý qua Apache Lucene engine).

---

## 2. Bảng Danh mục Index Chi tiết theo Collection

### 2.1. Collection: `users`
| Tên Index | Các trường cấu thành | Loại Index | Mục đích & Nghiệp vụ |
| :--- | :--- | :---: | :--- |
| `idx_users_email_unique` | `{ email: 1 }` | **Unique** | Đảm bảo tính duy nhất của email tài khoản; phục vụ xác thực đăng nhập nhanh nhất. |
| `idx_users_role_status` | `{ role: 1, status: 1 }` | Compound | Phục vụ trang quản trị phân loại tài khoản (`ROLE_CUSTOMER`, `ACTIVE`). |

---

### 2.2. Collection: `categories` & `brands`
| Collection | Tên Index | Các trường cấu thành | Loại Index | Mục đích |
| :--- | :--- | :--- | :---: | :--- |
| `categories` | `idx_categories_slug_unique`| `{ slug: 1 }` | **Unique** | Tìm danh mục qua URL slug (ví dụ: `/danh-muc/laptop`). |
| `categories` | `idx_categories_parent_sort`| `{ parentId: 1, sortOrder: 1 }`| Compound | Truy vấn danh mục con và sắp xếp hiển thị menu. |
| `brands` | `idx_brands_slug_unique` | `{ slug: 1 }` | **Unique** | Tìm thương hiệu qua URL slug. |
| `brands` | `idx_brands_active` | `{ isActive: 1 }` | Single | Lọc danh sách thương hiệu đang bán. |

---

### 2.3. Collection: `products`
| Tên Index | Các trường cấu thành | Loại Index | Mục đích & Áp dụng quy tắc ESR |
| :--- | :--- | :---: | :--- |
| `idx_products_sku_unique` | `{ sku: 1 }` | **Unique** | Mã quản lý kho duy nhất toàn hệ thống. |
| `idx_products_slug_unique` | `{ slug: 1 }` | **Unique** | Truy cập trang chi tiết sản phẩm chuẩn SEO. |
| `idx_products_category_status_price` | `{ categorySlug: 1, status: 1, inStock: 1, salePrice: 1 }` | **Compound (ESR)** | Phục vụ trang danh mục: Lọc danh mục (`Equality`), trạng thái (`Equality`), còn hàng (`Equality`), và sắp xếp/lọc theo giá (`Sort/Range`). |
| `idx_products_brand_price` | `{ brandName: 1, status: 1, salePrice: 1 }` | Compound | Phục vụ xem tất cả sản phẩm của một thương hiệu. |
| `idx_products_laptop_usecases` | `{ categorySlug: 1, "attributes.useCases": 1, salePrice: 1 }` | Compound (Multikey) | Hỗ trợ bộ lọc nhu cầu Laptop (Gaming, Đồ họa) và sắp xếp theo giá. |
| `idx_products_text_search` | `{ name: "text", tags: "text", shortDescription: "text" }` | **Text Index** | Phục vụ Keyword Search truyền thống (Trọng số: `name: 10`, `tags: 5`, `shortDescription: 2`). |

---

### 2.4. Collection: `product_embeddings` (Hỗ trợ Đa Phiên bản — Multi-version Indexes)
- **B-Tree Indexes Nội bộ:**
  - `idx_embeddings_product_model_unique`: `{ productId: 1, modelVersion: 1 }` (**Unique Compound Index**). Đảm bảo mỗi sản phẩm chỉ có tối đa một bản ghi vector cho mỗi phiên bản mô hình, hỗ trợ lưu trữ đồng thời Model V1 và Model V2 trong quá trình Zero-downtime Migration.
  - `idx_embeddings_one_active_per_product`: `{ productId: 1 }` (**Partial Unique Index**: `unique: true, partialFilterExpression: { isActive: true }`). **Đảm bảo mỗi sản phẩm chỉ có TỐI ĐA MỘT embedding active** tại bất kỳ thời điểm nào. Cú pháp này được hỗ trợ tiêu chuẩn trên MongoDB 3.2+ và tương thích hoàn toàn với MongoDB 7.0+. Khi kích hoạt model mới, nếu có 2 tiến trình cùng cập nhật `isActive: true` cho 1 sản phẩm, MongoDB sẽ lập tức ném lỗi trùng khóa `E11000`, ngăn chặn hoàn toàn trạng thái split-brain.
  - `idx_embeddings_status_sync`: `{ embeddingStatus: 1, updatedAt: 1 }` giúp AI Service Worker quét nhanh các bản ghi `"PENDING"` hoặc `"OUTDATED"` để tính toán lại vector.

- **Quy tắc Quản lý Index Vector Cấp Hệ thống & Naming Convention:**
  - **Quy ước đặt tên bất biến:** `idx_vector_search_<model_slug>_<dimensions>`. Mỗi Index gắn chặt với một Model Version và một số chiều duy nhất. Tuyệt đối không tái sử dụng index khi chuyển đổi số chiều.
  - **Phân định Active Product vs Model Active Hệ thống:** Partial Unique Index chỉ đảm bảo mỗi sản phẩm có 1 vector active. Cấp hệ thống quản lý biến `ACTIVE_EMBEDDING_MODEL_VERSION` và `ACTIVE_VECTOR_INDEX_NAME` để đồng bộ giữa FastAPI và Spring Boot, đảm bảo Query Vector và Document Vector luôn tương thích số chiều $100\%$.
  - **Phạm vi Catalog Giai đoạn Đầu (Laptop Only):** Vector Search Index chỉ đánh chỉ mục cho sản phẩm danh mục Laptop (`metadata.categorySlug: "laptop"`). Các danh mục Phone, Tablet, Accessories dùng MongoDB Text Index `idx_products_text_search`, không sinh vector trong Phase 1.

- **Định nghĩa Modern Atlas Vector Search Index (JSON Config):**
```json
{
  "name": "idx_vector_search_text_embedding_3_small_1536",
  "mappings": {
    "dynamic": true,
    "fields": {
      "vector": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      },
      "metadata.categorySlug": {
        "type": "filter"
      },
      "metadata.brandName": {
        "type": "filter"
      },
      "metadata.salePriceVnd": {
        "type": "filter"
      },
      "metadata.useCases": {
        "type": "filter"
      }
    }
  }
}
```
> [!NOTE]
> Số chiều `1536` và model trong cấu hình trên là ví dụ minh họa. Số chiều và thuật toán cụ thể chưa được chốt cứng và sẽ được cấu hình chính thức sau giai đoạn benchmark thực tế.
> Lưu ý trường giá `metadata.salePriceVnd` sử dụng kiểu số nguyên `Int64` (`NumberLong`) để lọc khoảng giá chính xác trong Lucene filter.

---

### 2.5. Collection: `carts` (Unique Index cho Người dùng Xác thực)

> [!NOTE]
> **Quyết định Nghiệp vụ ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT:**  
> Giỏ hàng chỉ dành riêng cho người dùng đã đăng nhập (Authenticated Users). Bỏ hoàn toàn Guest Cart, `cartType`, `sessionId` và các Partial Unique Index tương ứng.

> [!IMPORTANT]
> **Chính sách Hết hạn Giỏ hàng:** Chính sách tự động hết hạn hoặc xóa Cart (như TTL 30 ngày) chưa được phê duyệt và chưa triển khai trong phiên bản hiện tại. Toàn bộ TTL Index trên `carts` đã được loại bỏ. Giỏ hàng của người dùng được lưu trữ bền vững theo tài khoản.

| Tên Index | Các trường cấu thành | Loại Index / Tùy chọn | Mục đích & Nghiệp vụ |
| :--- | :--- | :---: | :--- |
| `idx_carts_user_unique` | `{ userId: 1 }` | **Unique** | Đảm bảo mỗi tài khoản người dùng chỉ có duy nhất 1 giỏ hàng trong toàn hệ thống (Quan hệ logic 1:0..1). |

---

### 2.6. Collection: `orders`
| Tên Index | Các trường cấu thành | Loại Index | Mục đích & Áp dụng quy tắc ESR |
| :--- | :--- | :---: | :--- |
| `idx_orders_idempotency_unique` | `{ idempotencyKey: 1 }` | **Unique** | Chống tạo đơn trùng lặp khi người dùng bấm thanh toán nhiều lần hoặc mạng chập chờn. |
| `idx_orders_code_unique` | `{ orderCode: 1 }` | **Unique** | Tra cứu mã đơn hàng phục vụ khách hàng và chăm sóc khách hàng. |
| `idx_orders_gateway_tx_unique` | `{ "payment.gatewayTransactionId": 1 }` | **Partial Unique** | `unique: true, partialFilterExpression: { "payment.gatewayTransactionId": { $type: "string" } }`. Đảm bảo mỗi mã giao dịch cổng VNPAY/MoMo chỉ gắn với 1 đơn duy nhất. |
| `idx_orders_refund_idemp_unique`| `{ "payment.refund.idempotencyKey": 1 }`| **Partial Unique** | `unique: true, partialFilterExpression: { "payment.refund.idempotencyKey": { $type: "string" } }`. Chống gửi trùng lặp yêu cầu hoàn tiền. |
| `idx_orders_refund_gateway_tx_unique`| `{ "payment.refund.gatewayRefundId": 1 }`| **Partial Unique** | `unique: true, partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } }`. Chống xử lý lặp callback/webhook hoàn tiền từ cổng thanh toán.<br>*Lưu ý Kiến trúc:* `gatewayRefundId` chỉ đảm bảo duy nhất trong phạm vi từng cổng (Locally Unique per Provider). Duy trì index đơn này làm baseline v1.2.1; khuyến nghị áp dụng Namespace Prefixing (`VNPAY:...`, `MOMO:...`) tại tầng ứng dụng, hoặc nâng cấp thành Compound Partial Unique Index `{ "payment.gatewayName": 1, "payment.refund.gatewayRefundId": 1 }` khi mở rộng nhiều cổng. |
| `idx_orders_user_created` | `{ userId: 1, createdAt: -1 }` | **Compound (ESR)** | Màn hình "Lịch sử mua hàng": Lọc theo `userId` (`Equality`) và sắp xếp đơn mới nhất lên đầu (`Sort`). |
| `idx_orders_expiration_poll` | `{ orderStatus: 1, paymentStatus: 1, reservationStatus: 1, expiresAt: 1 }` | Compound | Phục vụ Scheduled Worker quét định kỳ các đơn hàng hết hạn thanh toán (15 phút) để tự động giải phóng tồn kho đã giữ (Release Reservation). |

---

### 2.7. Collection: `product_reviews` (Partial Unique Index hỗ trợ Soft-Delete)
| Tên Index | Các trường cấu thành | Tùy chọn Index | Mục đích & Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `idx_reviews_active_user_product_unique`| `{ userId: 1, productId: 1 }` | `unique: true, partialFilterExpression: { status: { $in: ["PENDING", "APPROVED", "REJECTED"] } }` | Mỗi người dùng chỉ có 1 đánh giá đang hoạt động cho mỗi sản phẩm. Nếu đánh giá cũ bị xóa mềm (`DELETED`), khách có thể tạo lại đánh giá mới. |
| `idx_reviews_product_created` | `{ productId: 1, status: 1, createdAt: -1 }` | Compound | Lấy danh sách review đã duyệt (`status = 'APPROVED'`) của một sản phẩm, mới nhất lên đầu. |

---

### 2.8. Interaction & Log Collections (Chiến lược TTL Index)

> [!WARNING]
> **Lưu ý Vận hành TTL Index:**  
> TTL Monitor chạy ngầm mỗi 60 giây và có thể bị trễ dưới tải cao. Vì vậy, các câu lệnh truy vấn nghiệp vụ của Backend bắt buộc phải có điều kiện lọc thời gian tường minh: `expiresAt: { $gt: new Date() }`.

| Collection | Tên Index | Các trường cấu thành | Loại Index | Mục đích & Thời gian sống (TTL) |
| :--- | :--- | :--- | :---: | :--- |
| `user_events` | `idx_events_user_time` | `{ userId: 1, eventTime: -1 }` | Compound | Truy vấn lịch sử tương tác gần nhất của người dùng phục vụ mô hình Recommendation. |
| `user_events` | `idx_events_session_time`| `{ sessionId: 1, eventTime: -1 }` | Compound | Truy vấn tương tác của khách vãng lai. |
| `user_events` | `idx_events_impression_click`| `{ "metadata.impressionId": 1, eventType: 1 }` | Compound | Tăng tốc tính toán CTR và đo lường chuyển đổi từ gợi ý sang mua hàng. |
| `user_events` | `idx_events_ttl` | `{ eventTime: 1 }` | **TTL Index** | `expireAfterSeconds: 7776000` (Tự động xóa sau **90 ngày**). |
| `user_preference_profiles`| `idx_user_pref_unique` | `{ userId: 1 }` | **Unique** | Lưu trữ hồ sơ sở thích dài hạn sau khi tổng hợp roll-up. |
| `search_logs` | `idx_search_session_time`| `{ sessionId: 1, createdAt: -1 }` | Compound | Phân tích phiên tìm kiếm. |
| `search_logs` | `idx_search_ttl` | `{ createdAt: 1 }` | **TTL Index** | `expireAfterSeconds: 7776000` (Tự động xóa sau **90 ngày**). |
| `recommendation_logs`| `idx_rec_impression_unique`| `{ impressionId: 1 }` | **Unique** | Khóa định danh phiên hiển thị gợi ý. |
| `recommendation_logs`| `idx_rec_algo_perf` | `{ algorithmVersion: 1, placement: 1, createdAt: -1 }` | Compound | Đo lường hiệu năng thuật toán và CTR. |
| `recommendation_logs`| `idx_rec_ttl` | `{ createdAt: 1 }` | **TTL Index** | `expireAfterSeconds: 5184000` (Tự động xóa sau **60 ngày**). |

---

### 2.9. AI Advisor Collections
| Collection | Tên Index | Các trường cấu thành | Loại Index | Mục đích |
| :--- | :--- | :---: | :--- |
| `ai_conversations` | `idx_ai_conv_session_updated`| `{ sessionId: 1, updatedAt: -1 }` | Compound | Lấy danh sách phiên chat gần đây của khách vãng lai. |
| `ai_conversations` | `idx_ai_conv_user_updated` | `{ userId: 1, updatedAt: -1 }` | Compound | Lấy lịch sử tư vấn AI của tài khoản đã đăng nhập. |
| `ai_messages` | `idx_ai_msg_conv_created` | `{ conversationId: 1, createdAt: 1 }` | Compound | Tải tuần tự lịch sử tin nhắn trong một cuộc trò chuyện từ cũ đến mới. |
