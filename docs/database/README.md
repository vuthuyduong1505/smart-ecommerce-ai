# Tài liệu Thiết kế Cơ sở dữ liệu MongoDB (Database Specification v1.2.1 - Technical Consistency Edition)
**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect  
**Trạng thái thiết kế:** Hoàn tất rà soát chuyên sâu, chuẩn hóa cấu trúc dữ liệu và đồng bộ toàn diện v1.2.1 (Specification Finalized & Fully Consistent – Sẵn sàng triển khai code)  
**Ngày cập nhật:** 15/11/2026  

---

## 1. Tổng quan Kiến trúc Dữ liệu
Hệ thống **Smart E-commerce AI** sử dụng **MongoDB 7.0+** làm cơ sở dữ liệu chính, được thiết kế chuyên biệt cho mô hình thương mại điện tử đơn cửa hàng (Single-store), hỗ trợ 4 danh mục công nghệ (**Laptop**, **Phone**, **Tablet**, **Accessories**) với trọng tâm tích hợp AI vào danh mục Laptop.

Kiến trúc dữ liệu v1.2.1 giải quyết triệt để các bài toán vận hành thực tế và hoàn thiện 5 nhóm vấn đề kỹ thuật trọng yếu:
- **Tồn kho hai mức (`quantity`, `reserved`):** Quy trình 3 bước (Reserve $\rightarrow$ Confirm $\rightarrow$ Release) với atomic conditional check `quantity - reserved >= requestedQty` và công thức `inStock` nhất quán. **Thời hạn giữ kho 15 phút ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT (APPROVED)**. Trạng thái `EXPIRED` là terminal, late webhook nếu còn hàng sẽ cấp một `reservationId` hoàn toàn mới và đẩy phiên cũ vào `reservationHistory`.
- **Chuẩn hóa Giao dịch Hoàn tiền (Standardized Refund Structure):** Thống nhất 100% cấu trúc `payment.refund` với các trường chuẩn: `refundId`, `idempotencyKey` (UUID, Partial Unique Index), `gatewayRefundId` (Partial Unique Index), `amount` (`Decimal128`), `status` (`REFUND_PENDING` $\rightarrow$ `REFUNDED` / `REFUND_FAILED`), `reason`, `retryCount`, và cơ chế retry tự động / đối soát kế toán.
- **Xử lý Trả hàng & Hoàn tiền Một phần (Quantity-based Return Tracking):** Thay thế hoàn toàn các cờ Boolean (`isReturned`, `isRefunded`) bằng hai trường số lượng chính xác: `returnedQuantity` (trả lại vật lý) và `refundedQuantity` (hoàn tiền tài chính). Quyền đánh giá sản phẩm (Review Eligibility) được xét theo số lượng khách hàng thực tế còn giữ lại ($\text{quantity} - \text{returnedQuantity} > 0$).
- **Giỏ hàng Yêu cầu Xác thực & Bền vững (No Cart TTL):** **Quyết định nghiệp vụ ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT (APPROVED)** thay thế hoàn toàn phương án Guest Cart / Cart Merge. Chỉ người dùng đã đăng nhập mới được thêm sản phẩm vào giỏ hàng (`userId` bắt buộc, Unique Index `{ userId: 1 }`, quan hệ `1:0..1`, tối đa 50 items/cart). **Loại bỏ chính sách Cart TTL 30 ngày** chưa được phê duyệt, giỏ hàng lưu trữ bền vững theo tài khoản.
- **Đảm bảo Tối đa Một Embedding Active:** Hỗ trợ quan hệ đa phiên bản **`1:0..N`** theo `modelVersion` (Unique Compound Index `{ productId: 1, modelVersion: 1 }`), đồng thời bổ sung **Partial Unique Index `{ productId: 1 }` với `{ isActive: true }`** để đảm bảo tuyệt đối không có 2 embedding active cùng lúc, hỗ trợ Zero-downtime Migration an toàn không xung đột.
- **Sơ đồ Thực thể Chuẩn hóa:** Phân tách rạch ròi giữa Sơ đồ ER Cấp Collection (chỉ 14 collections vật lý, không nhầm lẫn subdocuments) và Sơ đồ Cấu trúc Document Nhúng (`carts.items` 0..50 items, `orders.items` snapshot 1..N items).

---

## 2. Bản đồ Tài liệu Kỹ thuật Chi tiết

Toàn bộ đặc tả kỹ thuật chi tiết được cấu trúc thành các tài liệu thành phần trong thư mục này:

1. 📄 [database-design.md](file:///D:/smart-ecommerce-ai/docs/database/database-design.md):  
   *Kiến trúc tổng quan v1.2.1, thiết kế tồn kho hai mức (Reserve 15 phút APPROVED), giỏ hàng xác thực bền vững (No Cart TTL), review policy xét theo số lượng thực nhận, chuẩn hóa cấu trúc refund, bảo đảm tối đa 1 active embedding, và xử lý late webhook an toàn.*

2. 📋 [collection-specification.md](file:///D:/smart-ecommerce-ai/docs/database/collection-specification.md):  
   *Đặc tả chi tiết 14 collections: cấu trúc giỏ hàng không TTL, document mẫu JSON chuẩn BSON strict, refund object chuẩn hóa, returnedQuantity/refundedQuantity, quan hệ logic và các truy vấn nghiệp vụ.*

3. 🗺️ [relationship-diagram.md](file:///D:/smart-ecommerce-ai/docs/database/relationship-diagram.md):  
   *Sơ đồ Mermaid ER Diagram cấp Collection (chỉ 14 collections thực tế) kèm Sơ đồ Cấu trúc Document Nhúng riêng biệt (Embedded Subdocument Mapping), thể hiện chính xác cardinality giỏ hàng (0..50) và hóa đơn (1..N).*

4. ⚡ [index-strategy.md](file:///D:/smart-ecommerce-ai/docs/database/index-strategy.md):  
   *Chiến lược đánh chỉ mục: Unique Index `{ userId: 1 }` cho Giỏ hàng (đã bỏ TTL index), Partial Unique Index `{ productId: 1 }` `{ isActive: true }` cho Embeddings, Partial Unique Indexes cho `payment.refund.idempotencyKey` và `payment.refund.gatewayRefundId`.*

5. 🛡️ [data-validation-rules.md](file:///D:/smart-ecommerce-ai/docs/database/data-validation-rules.md):  
   *Bộ quy tắc kiểm thực và toàn vẹn dữ liệu: MongoDB JSON Schema Validation (`$jsonSchema`) cho Orders (refund chuẩn hóa, returnedQuantity, refundedQuantity), Carts (maxItems 50, bỏ expiresAt), logic Java kiểm tra quyền Review theo số lượng thực giữ, và quy chuẩn thuộc tính Laptop phục vụ RAG.*

6. 📑 [FINAL-REVIEW-v1.2.1.md](file:///D:/smart-ecommerce-ai/docs/database/FINAL-REVIEW-v1.2.1.md):  
   *Báo cáo thẩm định kỹ thuật phiên bản v1.2.1, chi tiết khắc phục 5 nhóm vấn đề kỹ thuật, kết quả kiểm tra tính nhất quán liên tài liệu.*

7. 🔍 [AUDIT-REPORT-v1.2.1.md](file:///D:/smart-ecommerce-ai/docs/database/AUDIT-REPORT-v1.2.1.md):  
   *Báo cáo kiểm toán kỹ thuật độc lập v1.2.1, xác minh 4 trọng tâm: Refund Schema (PASS), Refund Retry Policy (PENDING), Embedding Blue-Green (PASS WITH CONDITIONS), Git Evidence (PASS).*

8. 🚀 [IMPLEMENTATION-READINESS-v1.2.1.md](file:///D:/smart-ecommerce-ai/docs/database/IMPLEMENTATION-READINESS-v1.2.1.md):  
   *Báo cáo sẵn sàng triển khai mã nguồn, cơ chế quản lý version embedding cấp hệ thống (SSOT), runbook 9 giai đoạn blue-green migration, phân định phạm vi catalog Laptop, rà soát refund index và lộ trình code.*

---

## 3. Danh sách Collections trong Hệ thống (14 Collections)

```
Smart E-commerce AI Data Model v1.2.1
├── Core Collections
│   ├── users                      # Tài khoản, quyền hạn, sổ địa chỉ nhúng, linkedSessionIds
│   ├── categories                 # Danh mục phân cấp cha-con (Laptop, Phone, Tablet, Accessories)
│   ├── brands                     # Thương hiệu (Apple, Dell, Asus, Lenovo, Samsung,...)
│   ├── products                   # Sản phẩm, tồn kho hai mức (quantity, reserved), thông số đa hình
│   ├── product_embeddings         # Vector embeddings đa phiên bản (1:0..N), tối đa 1 active, Int64 price metadata
│   ├── carts                      # Giỏ hàng người dùng xác thực (userId bắt buộc, Unique { userId: 1 }, 1:0..1, No TTL)
│   └── orders                     # Đơn hàng, snapshot giá lịch sử, idempotencyKey, refund object chuẩn, returnedQuantity
├── Interaction & Tracking Collections
│   ├── product_reviews            # Đánh giá 1 review/user/product, verified purchase xét theo số lượng thực giữ
│   ├── user_events                # Clickstream events (TTL 90 ngày) phục vụ Recommendation
│   ├── user_preference_profiles   # Hồ sơ sở thích người dùng tích lũy dài hạn sau Roll-up (1:0..1 với users)
│   ├── search_logs                # Nhật ký tìm kiếm từ khóa, bộ lọc (TTL 90 ngày)
│   └── recommendation_logs        # Nhật ký hiển thị gợi ý mang impressionId & item-level impressionItemId (TTL 60 ngày)
└── AI Advisor Collections
    ├── ai_conversations           # Phiên hội thoại tư vấn bán hàng của khách
    └── ai_messages                # Chi tiết tin nhắn, token tiêu thụ và sản phẩm viện dẫn RAG
```

---

## 4. Các Quyết định Kỹ thuật Trọng yếu (Architectural Decisions v1.2.1)

| Hạng mục | Quyết định Kỹ thuật & Nghiệp vụ | Trạng thái & Giá trị mang lại |
| :--- | :--- | :---: |
| **Inventory Reservation Timeout** | Giữ hàng 15 phút; `EXPIRED` là terminal state; late webhook tạo reservation mới nếu còn hàng. | **APPROVED**<br>(Chủ dự án phê duyệt) |
| **Chính sách Đánh giá (Review Policy)** | 1 review/user/product; cho phép tạo lại khi xóa mềm; kiểm tra đơn `DELIVERED`, `PAID`; xét theo số lượng thực giữ ($\text{returnedQuantity} < \text{quantity}$). | **APPROVED**<br>(Chủ dự án phê duyệt) |
| **Giỏ hàng Xác thực (Cart Auth)** | Chỉ người dùng đã đăng nhập mới được thêm giỏ hàng; loại bỏ hoàn toàn Guest Cart và Cart Merge; Unique `{ userId: 1 }`. | **APPROVED**<br>(Chủ dự án phê duyệt) |
| **Hết hạn Giỏ hàng (Cart TTL)** | Loại bỏ chính sách TTL 30 ngày (chưa phê duyệt); giỏ hàng lưu trữ bền vững theo tài khoản. | **ĐÃ HOÀN TẤT** |
| **Cấu trúc Refund Chuẩn hóa** | Thống nhất `refundId`, `idempotencyKey`, `gatewayRefundId`, `amount`, `status`, `reason`, `retryCount`. | **ĐÃ HOÀN TẤT** |
| **Thông số Refund Retry & Đối soát** | Đề xuất tối đa 3 lần retry, Exponential Backoff (1m, 5m, 15m), chuyển đối soát thủ công (Accounting Reconciliation). | **PENDING APPROVAL**<br>(Chờ duyệt nghiệp vụ) |
| **Quản lý Version Embedding Cấp Hệ thống** | Naming convention `idx_vector_search_<model>_<dim>`, Dimension compatibility, Handshake khởi động Backend & AI Service. | **ĐÃ HOÀN TẤT** |
| **Phạm vi Catalog AI Giai đoạn Đầu** | Giới hạn Vector Search cho danh mục **Laptop** Active; Phone, Tablet, Accessories dùng Text Search truyền thống. | **ĐÃ HOÀN TẤT** |
| **Blue-Green Migration Runbook** | Quy trình chuyển đổi 5 pha có thứ tự, xử lý chi tiết 7 kịch bản sự cố không đồng bộ và compensating rollback. | **ĐÃ HOÀN TẤT** |
| **Tối đa 1 Active Embedding** | Partial Unique Index `{ productId: 1 }` với `{ isActive: true }`; chặn split-brain khi switch model. | **ĐÃ HOÀN TẤT** |
| **Tồn kho Hai Mức** | `quantity` (thực tế), `reserved` (giữ hàng). Atomic update kiểm tra `quantity - reserved >= requestedQty`. | **ĐÃ HOÀN TẤT** |
| **Chữ ký Cổng Thanh toán** | Verifier riêng biệt cho VNPAY và MoMo theo tài liệu chính thức; xác thực chữ ký trước khi chạm DB. | **ĐÃ HOÀN TẤT** |
| **Cổng Thanh toán** | Không lồng HTTP vào Mongo Transaction để tránh timeout và khóa diện rộng. | **ĐÃ HOÀN TẤT** |
| **Đo lường CTR** | Gắn `impressionId`, item-level `impressionItemId` & `position`; deduplicate click; attribution 30m/24h. | **ĐÃ HOÀN TẤT** |
| **Chuyển đổi Tiền tệ** | Explicit Check `scale == 0` trước khi cast `Int64`; cấm tuyệt đối làm tròn ngầm (silent truncation). | **ĐÃ HOÀN TẤT** |
| **Bản chất TTL Index** | Chạy ngầm 60s, không thay thế query filter; ứng dụng luôn lọc chủ động `expiresAt > now`. | **ĐÃ HOÀN TẤT** |
| **Lựa chọn Mô hình Vector** | Benchmark so sánh `text-embedding-3-small` (1536 dims) vs `bge-m3` (1024 dims). | *PENDING BENCHMARK* |
| **Kiểm thử Tải TTL Index** | Load test 5,000 - 10,000 events/phút trên MongoDB Replica Set. | *PENDING BENCHMARK* |
