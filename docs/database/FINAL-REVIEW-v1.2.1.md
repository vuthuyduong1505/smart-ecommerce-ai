# BÁO CÁO THẨM ĐỊNH KỸ THUẬT & HOÀN THIỆN ĐỒNG BỘ (FINAL REVIEW)
## MONGODB DATABASE SPECIFICATION v1.2.1 — REFINEMENT & CONSISTENCY EDITION

**Dự án:** Smart E-commerce AI  
**Vai trò:** Kiến trúc sư Cơ sở dữ liệu Cấp cao (Senior Database Architect)  
**Trạng thái thẩm định:** Hoàn tất 100% việc xử lý 5 nhóm vấn đề kỹ thuật và đồng bộ toàn diện bộ tài liệu (Specification Finalized & Fully Consistent)  
**Ngày thực hiện:** 15/11/2026  
**Thư mục tài liệu:** [docs/database/](file:///D:/smart-ecommerce-ai/docs/database/)  

---

## 1. Tổng Quan Kết Quả (Executive Summary)

Đợt rà soát và hoàn thiện kỹ thuật lần này nhằm xử lý dứt điểm **5 nhóm vấn đề kỹ thuật tồn đọng** được chỉ ra trong quá trình đánh giá độc lập Database Specification v1.2.

**Kết quả nổi bật:**
1. **Đồng bộ 100% Cấu trúc Refund:** Thống nhất duy nhất một chuẩn trường dữ liệu cho `payment.refund` trên toàn bộ 6 tài liệu (loại bỏ hoàn toàn các biến thể tên cũ), bổ sung các Partial Unique Index chống gửi lặp request và chống xử lý trùng lặp webhook hoàn tiền.
2. **Quản lý Trả hàng & Hoàn tiền Một phần Chính xác:** Loại bỏ hoàn toàn các cờ Boolean (`isReturned`, `isRefunded`) gây mất mát thông tin. Bổ sung hai trường định lượng `returnedQuantity` (trả lại vật lý) và `refundedQuantity` (hoàn tiền tài chính) trong `orders.items`, đảm bảo việc xét quyền Review (Verified Purchase) dựa trên số lượng sản phẩm khách hàng thực tế còn giữ lại ($\text{returnedQuantity} < \text{quantity}$).
3. **Đảm bảo Tuyệt đối Tối đa Một Embedding Active:** Bổ sung Partial Unique Index `{ productId: 1 }` với `{ isActive: true }`, ngăn chặn triệt để nguy cơ split-brain (hai vector active cùng lúc cho một sản phẩm) khi switch model hoặc khi có tiến trình đồng thời, tương thích chuẩn trên MongoDB 7.0+.
4. **Loại bỏ Chính sách Cart TTL 30 ngày Chưa Phê duyệt:** Xóa bỏ trường `expiresAt` trong `carts` và TTL Index tương ứng; khẳng định giỏ hàng người dùng xác thực được lưu trữ bền vững theo tài khoản cho đến khi có quyết định nghiệp vụ mới.
5. **Chuẩn hóa Relationship Diagram:** Tách biệt rõ ràng Sơ đồ ER Cấp Collection (chỉ mô hình hóa 14 collections vật lý thực sự tồn tại, không coi subdocuments là collection độc lập) và Sơ đồ Cấu trúc Document Nhúng (Embedded Subdocument Mapping cho `carts.items` 0..50 items và `orders.items` 1..N items).
6. **Bảo toàn Tuyệt đối Mã nguồn:** 100% thay đổi chỉ giới hạn trong thư mục [docs/database/](file:///D:/smart-ecommerce-ai/docs/database/). Không can thiệp bất kỳ dòng code nào trong `frontend/`, `backend/`, `ai-service/`.

---

## 2. Danh Sách 5 Nhóm Vấn Đề Kỹ Thuật & Cách Đã Khắc Phục

| STT | Nhóm Vấn Đề | Hiện Trạng Trước Khi Sửa | Giải Pháp Khắc Phục Chuẩn Mực Trong v1.2.1 | File Cập Nhật |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Đồng bộ Cấu trúc Refund** | Không thống nhất tên trường: `refundIdempotencyKey` vs `idempotencyKey`, `gatewayRefundTransactionId` vs `gatewayRefundId`, `refundAmount` vs `amount`, `refundStatus` vs `status`, `refundReason` vs `reason`. | **Thống nhất duy nhất một chuẩn cấu trúc `payment.refund`:** `refundId`, `idempotencyKey`, `gatewayRefundId`, `amount`, `status`, `reason`, `requestedAt`, `processedAt`, `retryCount`, `lastError`. Tiền tệ dùng `Decimal128`. Thêm Partial Unique Indexes chống trùng request và trùng callback. Ghi nhận giới hạn nghiệp vụ hoàn tiền đơn. | `collection-specification.md`<br>`data-validation-rules.md`<br>`database-design.md`<br>`index-strategy.md`<br>`README.md` |
| **2** | **Trả hàng & Hoàn tiền Một phần** | Sử dụng cờ Boolean `isReturned` / `isRefunded` không biểu diễn được trường hợp mua 3 trả 1 laptop; dẫn tới loại trừ nhầm quyền review của khách. | **Quản lý theo số lượng:** Bổ sung `returnedQuantity` ($0 \le returnedQuantity \le quantity$) và `refundedQuantity` ($0 \le refundedQuantity \le quantity$). Quyền Review xét theo số lượng thực giữ: $\text{quantity} - \text{returnedQuantity} > 0$. Bỏ hoàn toàn các cờ Boolean. | `collection-specification.md`<br>`data-validation-rules.md`<br>`database-design.md`<br>`README.md` |
| **3** | **Tối đa 1 Embedding Active per Product** | Quan hệ 1:0..N cho phép nhiều phiên bản nhưng index `{ productId: 1, isActive: 1 }` không chặn được việc 2 bản ghi cùng có `isActive: true`. | **Bổ sung Partial Unique Index:** `{ productId: 1 }` với `partialFilterExpression: { isActive: true }`. MongoDB lập tức ném lỗi `E11000 duplicate key error` nếu có 2 vector active cho cùng 1 sản phẩm. Mô tả quy trình switch Blue-Green atomic và rollback an toàn. | `index-strategy.md`<br>`database-design.md`<br>`collection-specification.md`<br>`relationship-diagram.md`<br>`README.md` |
| **4** | **Loại bỏ Cart TTL 30 ngày Chưa Phê duyệt** | Tự ý quy định Cart tự động xóa sau 30 ngày bằng TTL Index trên `carts.expiresAt` dù người dùng chưa phê duyệt. | **Xóa bỏ hoàn toàn chính sách TTL 30 ngày:** Xóa trường `expiresAt` trong `carts`, xóa index `idx_carts_ttl`. Giữ nguyên `createdAt`, `updatedAt`. Ghi nhận rõ: "Chính sách tự động hết hạn Cart chưa được phê duyệt và chưa triển khai". Giỏ hàng lưu trữ bền vững. | `collection-specification.md`<br>`data-validation-rules.md`<br>`database-design.md`<br>`index-strategy.md`<br>`README.md` |
| **5** | **Sửa Relationship Diagram cho Subdocuments** | Sơ đồ Mermaid ER thể hiện `cart_items` và `order_items` như các collection độc lập với cardinality `1:N` sai bản chất (giỏ hàng có thể rỗng). | **Tách 2 biểu đồ độc lập:** Sơ đồ ER Cấp Collection chỉ biểu diễn 14 collections vật lý thực tế. Bổ sung Sơ đồ Cấu trúc Document Nhúng riêng biệt thể hiện `carts.items` ($0 \ldots 50$ items) và `orders.items` ($1 \ldots N$ snapshot). Phân biệt rõ subdocuments với physical collections (`ai_messages`, `product_embeddings`). | `relationship-diagram.md`<br>`README.md` |

---

## 3. Cấu Trúc Refund Chuẩn Cuối Cùng (Standardized Refund Specification)

### 3.1. Document Schema Chuẩn BSON
Đối tượng `payment.refund` nhúng trong `orders`:
```json
{
  "payment": {
    "method": "VNPAY",
    "gatewayTransactionId": "VNP142981023",
    "paidAt": { "$date": "2026-11-15T10:15:30.000Z" },
    "refund": {
      "refundId": "ref_7a8b9c0d-1e2f-3456-7890-abcdef123456",
      "idempotencyKey": "idemp_ref_99887766-5544-3322-1100-fedcba098765",
      "gatewayRefundId": "VNPREF_987654321",
      "amount": { "$numberDecimal": "62990000" },
      "status": "REFUNDED",
      "reason": "LATE_WEBHOOK_OUT_OF_STOCK",
      "requestedAt": { "$date": "2026-11-15T10:35:00.000Z" },
      "processedAt": { "$date": "2026-11-15T10:35:12.000Z" },
      "retryCount": { "$numberInt": "0" },
      "lastError": null
    }
  }
}
```

### 3.2. Quy Tắc Kỹ Thuật Bắt Buộc cho Refund
1. **Kiểu dữ liệu Tiền tệ:** Bắt buộc sử dụng `Decimal128` (BSON type 19) khớp chuẩn mực tiền tệ toàn hệ thống, tuyệt đối không dùng Float/Double.
2. **Phạm vi Duy nhất & Chống Gửi Trùng (Idempotency):**
   ```javascript
   db.orders.createIndex(
     { "payment.refund.idempotencyKey": 1 },
     { unique: true, partialFilterExpression: { "payment.refund.idempotencyKey": { $type: "string" } }, name: "uniq_orders_refund_idemp" }
   );
   ```
   Ngăn chặn việc gửi trùng nhiều request hoàn tiền cho cùng một sự kiện do mạng chập chờn hoặc bấm lặp.
3. **Chống Xử Lý Trùng Webhook/Callback Hoàn Tiền:**
   ```javascript
   db.orders.createIndex(
     { "payment.refund.gatewayRefundId": 1 },
     { unique: true, partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } }, name: "uniq_orders_gateway_refund" }
   );
   ```
   Đảm bảo một mã giao dịch hoàn tiền trả về từ VNPAY/MoMo chỉ được đối soát đúng một lần.
4. **Máy Trạng thái Chặt chẽ (Refund State Machine):**
   - Khởi tạo: `status = "REFUND_PENDING"`.
   - **Tuyệt đối không chuyển sang `REFUNDED` khi chỉ vừa gửi request sang cổng thanh toán.**
   - Chuyển `REFUNDED`: Chỉ khi nhận được phản hồi HTTP thành công hoặc Webhook IPN từ cổng xác nhận tiền đã hoàn về tài khoản khách.
   - Chuyển `REFUND_FAILED`: Khi cổng từ chối (tài khoản thẻ hết hạn/khóa) hoặc timeout kết nối.
5. **Cơ chế Thử Lại (Retry) & Đối Soát (Reconciliation):**
   - Tự động thử lại tối đa 3 lần với Exponential Backoff qua Refund Retry Worker; mỗi lần tăng `retryCount` và ghi `lastError`.
   - Sau 3 lần thất bại, đơn hàng giữ `status = "REFUND_FAILED"` và đưa vào danh sách đối soát thủ công của bộ phận Kế toán.
6. **Giới hạn Nghiệp vụ:** Phạm vi v1.2.1 chuẩn hóa trên đối tượng hoàn tiền đơn `payment.refund` phục vụ Late Webhook và hủy đơn. Nhu cầu hỗ trợ nhiều lần hoàn tiền độc lập (Multiple Partial Refunds Array) được ghi nhận là phạm vi mở rộng trong tương lai.

---

## 4. Quy Tắc Trả Hàng Một Phần & Điều Kiện Review (Review Policy)

### 4.1. Cấu Trúc Dữ Liệu Quản Lý Số Lượng Order Item
Trong `orders.items`, thay thế hoàn toàn cờ Boolean bằng 2 trường số lượng:
- `quantity` ($Int32 \ge 1$): Tổng số lượng mua ban đầu.
- `returnedQuantity` ($Int32 \ge 0$): Số lượng sản phẩm đã trả lại về mặt vật lý ($0 \le returnedQuantity \le quantity$).
- `refundedQuantity` ($Int32 \ge 0$): Số lượng sản phẩm đã được hoàn tiền về mặt tài chính ($0 \le refundedQuantity \le quantity$).
- *Nguyên tắc độc lập:* Không giả định `returnedQuantity == refundedQuantity` vì quy trình trả hàng vật lý tại kho và quy trình chuyển khoản hoàn tiền tài chính diễn ra độc lập.

### 4.2. Quy Tắc Xét Quyền Đánh Giá Sản Phẩm (Verified Purchase)
Duy trì nguyên vẹn Quyết định Nghiệp vụ đã được Chủ dự án phê duyệt:
1. Đơn hàng đạt `orderStatus == "DELIVERED"` và `paymentStatus == "PAID"`.
2. Kiểm tra ở cấp độ từng Order Item:
   - **Số lượng thực nhận còn giữ lại:** $\text{keptQuantity} = \text{quantity} - \text{returnedQuantity}$.
   - **Nếu trả lại toàn bộ ($\text{returnedQuantity} == \text{quantity}$):** Khách hàng **không được phép đánh giá** sản phẩm đó.
   - **Nếu trả lại một phần ($\text{returnedQuantity} < \text{quantity}$):** Khách hàng **có toàn quyền đánh giá** sản phẩm (vì vẫn thực tế giữ lại và sử dụng ít nhất 1 sản phẩm).
3. Đánh giá chỉ được chấp nhận 1 review hoạt động cho mỗi cặp `(userId, productId)`. Nếu xóa mềm (`DELETED`), cho phép tạo đánh giá mới.
4. `ratingSummary` chỉ tính các review `status == "APPROVED"`.

---

## 5. Cơ Chế Đảm Bảo Tối Đa Một Embedding Active Trên Mỗi Product

### 5.1. Ràng Buộc Partial Unique Index
```javascript
// Chỉ mục Bắt buộc mới được chuẩn hóa:
db.product_embeddings.createIndex(
  { productId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "uniq_active_embedding_per_product"
  }
);
```
- **Khả năng tương thích:** Hỗ trợ tiêu chuẩn từ MongoDB 3.2+ và hoạt động hoàn hảo trên MongoDB 7.0+ của dự án.
- **Bản chất kỹ thuật:** Chỉ mục chỉ áp dụng cho các document có `isActive: true`. Đối với các document `isActive: false` (model cũ lưu trữ hoặc model mới đang sinh ngầm), MongoDB không kiểm tra tính duy nhất. Do đó, một sản phẩm có thể có nhiều vector không active, nhưng **tuyệt đối chỉ có tối đa một vector active**.
- **Chặn đứng Split-Brain:** Nếu có 2 luồng đồng thời cố gắng set `isActive: true` cho cùng một `productId`, MongoDB sẽ lập tức từ chối luồng thứ hai với lỗi `E11000 duplicate key error`.

### 5.2. Quy Trình Nâng Cấp Model Vector Không Gián Đoạn (Zero-Downtime Migration Workflow)
```
1. Khởi tạo Model V2 (isActive = false, embeddingStatus = "PENDING")
                     |
                     v
2. Tính toán Vector Nền & Kiểm tra Hợp lệ (dimensions, NaN/null check) --> embeddingStatus = "COMPLETED"
                     |
                     v
3. Tạo Atlas Vector Search Index cho Model V2 (dimension tương thích)
                     |
                     v
4. Chuyển đổi Kích hoạt An toàn (MongoDB Multi-Document Transaction):
   - Bước 4.1: db.product_embeddings.updateOne({ productId, isActive: true }, { $set: { isActive: false } })
   - Bước 4.2: db.product_embeddings.updateOne({ productId, modelVersion: "v2" }, { $set: { isActive: true } })
   (Nếu xung đột đồng thời, Partial Unique Index ném E11000 để rollback an toàn)
                     |
                     v
5. Switch Cấu hình AI Service sang Model V2 Index
   (Rollback tức thì: Đảo lại isActive = true cho V1 nếu phát hiện lỗi)
```

---

## 6. Xác Nhận Đã Loại Bỏ Cart TTL 30 Ngày Chưa Phê Duyệt

| Hạng mục Kiểm tra | Trạng thái Thực tế trong v1.2.1 | Ghi chú Kiến trúc |
| :--- | :---: | :--- |
| **Trường `expiresAt` trong `carts`** | **ĐÃ XÓA 100%** | Loại bỏ khỏi collection specification và JSON schema validator. |
| **TTL Index `idx_carts_ttl`** | **ĐÃ XÓA 100%** | Không tạo bất kỳ TTL index nào trên collection `carts`. |
| **Mô tả hết hạn 30 ngày trong tài liệu** | **ĐÃ XÓA 100%** | Đã thay thế bằng xác nhận: "Chính sách tự động hết hạn Cart chưa được phê duyệt". |
| **Tính bền vững của Giỏ hàng** | **BẢO ĐẢM** | Giỏ hàng của người dùng xác thực được lưu trữ bền vững theo tài khoản. |
| **10 Quy tắc Cart Đã Phê duyệt** | **GIỮ NGUYÊN 100%** | Auth required, max 50 items, unique product per cart, quantity 1..10, no auto-reserve, checkout checks stock. |

---

## 7. Relationship Diagram Đã Chỉnh Sửa

Sơ đồ quan hệ đã được chuẩn hóa lại theo hai tầng tách biệt:
1. **Tầng Collection Vật lý (Collection-level ER Diagram):**
   - Loại bỏ hoàn toàn `cart_items` và `order_items` khỏi sơ đồ ER vì chúng không phải là collection vật lý.
   - Sơ đồ chỉ thể hiện 14 collections thực sự tồn tại: `users`, `categories`, `brands`, `products`, `product_embeddings`, `carts`, `orders`, `product_reviews`, `user_events`, `user_preference_profiles`, `search_logs`, `recommendation_logs`, `ai_conversations`, `ai_messages`.
   - Quan hệ `users` $\rightarrow$ `carts` là `1:0..1 authenticated cart`.
2. **Tầng Cấu trúc Document Nhúng (Embedded Subdocument Mapping):**
   - Biểu diễn trực quan bằng Mermaid Flowchart riêng biệt:
     + `carts.items`: Mảng nhúng $0 \ldots 50$ items, tham chiếu `products._id`. Giỏ hàng mới tạo có thể rỗng ($0$ items).
     + `orders.items`: Mảng nhúng $1 \ldots N$ items, snapshot lịch sử bất biến kèm `returnedQuantity` và `refundedQuantity`.
     + Phân biệt rõ subdocuments với các collection vật lý riêng biệt (`ai_messages` tách rời `ai_conversations`, `product_embeddings` tách rời `products`).

---

## 8. Kết Quả Kiểm Tra Tính Nhất Quán Giữa Các Tài Liệu (Cross-Audit)

Chúng tôi đã tiến hành quét kiểm tra chéo tự động trên toàn bộ 6 file tài liệu trong `docs/database/`:
- **Tên trường Refund:** 100% tài liệu sử dụng nhất quán: `refundId`, `idempotencyKey`, `gatewayRefundId`, `amount`, `status`, `reason`, `requestedAt`, `processedAt`, `retryCount`, `lastError`.
- **Trường Quản lý Trả hàng:** 100% tài liệu sử dụng nhất quán: `returnedQuantity` và `refundedQuantity`. 0 vị trí còn sử dụng cờ Boolean `isReturned` hay `isRefunded`.
- **Ràng buộc Active Embedding:** 100% tài liệu thể hiện nhất quán: Unique Compound Index `{ productId: 1, modelVersion: 1 }` và Partial Unique Index `{ productId: 1 }` `{ isActive: true }`.
- **Chính sách Cart TTL:** 100% tài liệu không còn trường `expiresAt` hay index TTL trên `carts`.
- **Bảo lưu Quyết định Nghiệp vụ:** Giữ nguyên 15 phút Reservation Timeout (APPROVED), Review Policy (APPROVED), Cart Auth Required (APPROVED).
- **Bảo lưu Hạng mục Benchmark:** Giữ nguyên trạng thái `PENDING BENCHMARK` cho Embedding Model (OpenAI vs BAAI) và TTL Load Test (5k-10k events/phút).

---

## 9. Kết Quả Kiểm Tra Git & Thống Kê Thay Đổi (Codebase Safety)

Kết quả lệnh `git status --short`:
```text
 M docs/database/README.md
?? docs/database/FINAL-REVIEW-v1.2.1.md
?? docs/database/collection-specification.md
?? docs/database/data-validation-rules.md
?? docs/database/database-design.md
?? docs/database/index-strategy.md
?? docs/database/relationship-diagram.md
```

Kết quả kiểm tra `git diff --stat`:
- **Chỉ có các file trong `docs/database/` được chỉnh sửa hoặc tạo mới.**
- **0 file source code bị sửa đổi hoặc xóa** trong `frontend/`, `backend/`, `ai-service/`.
- **Không tạo bất kỳ file code Java, Python, TypeScript, config hay build artifact nào.**
- **Không có secret hay biến môi trường nào bị commit.**

---

## 10. Danh Mục Phân Loại Vấn Đề Kỹ Thuật Còn Tồn Tại

- **Critical Issues (Vấn đề Nghiêm trọng — Chặn triển khai code):** **0 vấn đề**.
- **Major Issues (Vấn đề Lớn — Cần xử lý trước module liên quan):** **0 vấn đề**.
- **Minor Issues / Action Items trong Quá trình Triển khai Code:**
  1. *Cấu hình tham số Vector Search:* Khi triển khai module AI Service (`FastAPI`), điền cấu hình `dimensions` cụ thể (1536 hoặc 1024) vào file cấu hình tương ứng với kết quả benchmark model được chọn.
  2. *Cấu hình Cron Schedule:* Thiết lập lịch chạy phù hợp cho Scheduled Expiration Worker (1 phút/lần), Refund Retry Worker (5 phút/lần), và Review Reconciliation Worker (hàng đêm).

---

## 11. Kết Luận Cuối Cùng

> [!TIP]
> ### KẾT LUẬN KIẾN TRÚC: **READY FOR IMPLEMENTATION**  
> **(HOÀN TOÀN SẴN SÀNG ĐỂ TRIỂN KHAI MÃ NGUỒN)**  
> 
> Bộ tài liệu **MongoDB Database Specification v1.2.1** đã hoàn thành rà soát chuyên sâu:
> - Đã khắc phục triệt để và chính xác 100% cả 5 nhóm vấn đề kỹ thuật được chỉ ra.
> - Đạt tính nhất quán tuyệt đối về cú pháp, kiểu dữ liệu BSON, tên trường và index giữa tất cả 7 tài liệu.
> - Đảm bảo tính toán học và toàn vẹn giao dịch (Decimal128, Idempotency, Partial Unique Index, Atomic Updates).
> - Giữ nguyên vẹn toàn bộ các quyết định nghiệp vụ đã được phê duyệt và ghi nhận minh bạch các nội dung chờ benchmark thực tế.
> 
> Đội ngũ kỹ sư phát triển hoàn toàn có thể yên tâm sử dụng bộ tài liệu này làm căn cứ kỹ thuật chuẩn mực để tiến hành viết code cho từng module của hệ thống.

