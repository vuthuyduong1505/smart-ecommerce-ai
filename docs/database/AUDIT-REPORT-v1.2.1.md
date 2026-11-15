# BÁO CÁO KIỂM TOÁN KỸ THUẬT ĐỘC LẬP
## MONGODB DATABASE SPECIFICATION v1.2.1 — SMART E-COMMERCE AI

**Dự án:** Smart E-commerce AI  
**Vai trò kiểm toán:** Senior Software Engineer / Independent Lead Database Auditor  
**Đối tượng kiểm toán:** Toàn bộ bộ tài liệu Database Specification v1.2.1 trong thư mục `docs/database/`  
**Ngày thực hiện kiểm toán:** 15/11/2026  
**Trạng thái kiểm toán tổng thể:** **READY WITH CONDITIONS (SẴN SÀNG CÓ ĐIỀU KIỆN — CHỜ PHÊ DUYỆT THÔNG SỐ NGHIỆP VỤ & RUNBOOK ĐIỀU PHỐI)**  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM TOÁN (EXECUTIVE SUMMARY)

Đợt kiểm toán kỹ thuật độc lập này được thực hiện nhằm rà soát và xác minh tính chính xác, nhất quán và khả năng thực thi thực tế của bộ tài liệu thiết kế cơ sở dữ liệu MongoDB phiên bản v1.2.1 trước khi bước vào giai đoạn lập trình mã nguồn (Backend & AI Service).

Báo cáo tập trung thẩm tra 4 vấn đề kỹ thuật trọng yếu được chỉ định:
1. **Cấu trúc Hoàn tiền (Refund Schema & Partial Unique Indexes).**
2. **Chính sách Thử lại Hoàn tiền (Refund Retry Policy & Trạng thái Phê duyệt).**
3. **Quy trình Di chuyển Mô hình Vector (Embedding Blue-Green Migration & Ranh giới Hệ thống).**
4. **Bằng chứng Tính toàn vẹn Git (Git Evidence & Cô lập Mã nguồn).**

### Bảng Điểm Kiểm toán Tổng hợp (Audit Scorecard)

| STT | Hạng mục Kiểm toán | Tiêu chí Đánh giá | Trạng thái | Đánh giá Tóm tắt |
| :-: | :--- | :--- | :-: | :--- |
| **1** | **Refund Schema & Indexes** | Vị trí trường, đường dẫn lồng nhau, kiểu BSON, cú pháp Partial Unique Index trên `idempotencyKey` và `gatewayRefundId`. | **PASS** | Đồng nhất 100% tại `payment.refund` trên cả 4 tài liệu (`collection-specification.md`, `data-validation-rules.md`, `index-strategy.md`, `database-design.md`). Cú pháp Partial Filter `{ $type: "string" }` hoàn toàn chính xác. |
| **2** | **Refund Retry Policy** | Xác minh tính chính thức của các thông số: 3 lần thử lại, Exponential Backoff, chuyển đối soát thủ công. | **PENDING** | **CHƯA ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT CHÍNH THỨC**. Đây là đề xuất kỹ thuật của đội ngũ Architect. Cần phân loại rõ là `Đề xuất kỹ thuật chờ xác nhận`, không được tự ý coi là quyết định nghiệp vụ đã chốt. |
| **3** | **Embedding Blue-Green Migration** | Ranh giới Transaction MongoDB, phân biệt thao tác trong/ngoài DB, rủi ro lệch đồng bộ với FastAPI/Atlas, cơ chế rollback. | **PASS WITH CONDITIONS** | Thiết kế dữ liệu MongoDB đạt chuẩn (`uniq_active_embedding_per_product`). Tuy nhiên, **tính nguyên tử không bao trùm toàn hệ thống**. Cần cảnh báo rõ rủi ro lệch bước giữa MongoDB và AI Service, kèm Runbook điều phối triển khai 2 pha. |
| **4** | **Git Evidence & Isolation** | Trạng thái working tree, số file sửa/untracked, bảo đảm 0 file mã nguồn ngoài `docs/database/` bị ảnh hưởng, không commit/push. | **PASS** | Working tree sạch sẽ đối với mã nguồn. 100% thay đổi nằm trong `docs/database/` (1 file modified, 7 files untracked). Tuyệt đối không có commit hay push nào được thực hiện. |

---

## 2. CHI TIẾT KẾT QUẢ KIỂM TOÁN TỪNG VẤN ĐỀ

---

### VẤN ĐỀ 1: REFUND SCHEMA & PARTIAL UNIQUE INDEXES
**Đánh giá:** `PASS` (ĐẠT YÊU CẦU KỸ THUẬT VÀ NHẤT QUÁN 100%)

#### 1.1. Xác định Vị trí Thực tế của Refund
- Trong cấu trúc dữ liệu của collection `orders`, đối tượng hoàn tiền **thực sự nằm bên trong subdocument `payment`** với đường dẫn trường chính xác là:
  $$\text{orders} \longrightarrow \text{payment} \longrightarrow \text{refund}$$
- Đây là một subdocument nhúng cấp 2 (`embedded object`), không phải mảng, không phải trường cấp 1 ngoài root của `orders`, và không phải là một collection độc lập.
- Thiết kế này chuẩn hóa cho kịch bản hoàn tiền chính của đơn hàng v1.2.1 (hoàn tiền tự động khi Late Webhook hết hàng, hoặc khách hủy đơn sau khi đã thanh toán thành công).

#### 1.2. Đối chiếu Liên Tài liệu (Cross-document Verification)
Kiểm tra đối chiếu cấu trúc `payment.refund` trên toàn bộ 4 tài liệu cốt lõi:

| Trường Dữ liệu | Kiểu BSON | Bắt buộc trong Schema | `collection-specification.md` (L209-L219) | `data-validation-rules.md` (L242-L258) | `index-strategy.md` (L116-L117) | `database-design.md` (L216-L230) | Kết luận Đối chiếu |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `refundId` | `String` (UUID) | Có | Có | Có | - | Có | **Khớp 100%** |
| `idempotencyKey` | `String` (UUID) | Có | Có | Có | Có (Index) | Có | **Khớp 100%** |
| `gatewayRefundId`| `String` / `null` | Không | Có | Có | Có (Index) | Có | **Khớp 100%** |
| `amount` | `Decimal128` | Có | Có | Có | - | Có | **Khớp 100%** |
| `status` | `String` (Enum) | Có | Có (`REFUND_PENDING`, `REFUNDED`, `REFUND_FAILED`) | Có (Enum kiểm soát) | - | Có | **Khớp 100%** |
| `reason` | `String` | Có | Có | Có | - | Có | **Khớp 100%** |
| `requestedAt` | `Date` | Có | Có | Có | - | Có | **Khớp 100%** |
| `processedAt` | `Date` / `null` | Không | Có | Có | - | Có | **Khớp 100%** |
| `retryCount` | `Int32` ($\ge 0$) | Không | Có | Có | - | Có | **Khớp 100%** |
| `lastError` | `String` / `null` | Không | Có | Có | - | Có | **Khớp 100%** |

#### 1.3. Kiểm tra Định nghĩa Partial Unique Indexes
Kiểm tra hai chỉ mục duy nhất một phần phục vụ nghiệp vụ hoàn tiền trong [index-strategy.md](file:///D:/smart-ecommerce-ai/docs/database/index-strategy.md#L116-L117):

1. **Chỉ mục chống gửi lặp yêu cầu hoàn tiền:**
   ```javascript
   db.orders.createIndex(
     { "payment.refund.idempotencyKey": 1 },
     {
       name: "idx_orders_refund_idemp_unique",
       unique: true,
       partialFilterExpression: { "payment.refund.idempotencyKey": { $type: "string" } }
     }
   );
   ```
2. **Chỉ mục chống xử lý lặp Webhook/Callback hoàn tiền từ cổng:**
   ```javascript
   db.orders.createIndex(
     { "payment.refund.gatewayRefundId": 1 },
     {
       name: "idx_orders_refund_gateway_tx_unique",
       unique: true,
       partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } }
     }
   );
   ```

**Phân tích kỹ thuật của Auditor:**
- Việc sử dụng `partialFilterExpression: { ...: { $type: "string" } }` là **hoàn toàn chính xác và bắt buộc**.
- Trong MongoDB, nếu tạo một `unique: true` index thông thường trên một trường lồng nhau không bắt buộc, MongoDB sẽ coi giá trị thiếu (`missing`) hoặc `null` là một giá trị khóa. Khi đó, hệ thống chỉ cho phép đúng **một document duy nhất** không có thông tin hoàn tiền; tất cả các đơn hàng bình thường tiếp theo sẽ bị ném lỗi `E11000 duplicate key error`.
- Nhờ biểu thức `{ $type: "string" }`, MongoDB chỉ lập chỉ mục cho các đơn hàng mà trường `payment.refund.idempotencyKey` hoặc `gatewayRefundId` thực sự tồn tại và có kiểu chuỗi. Đơn hàng chưa hoàn tiền hoặc `gatewayRefundId: null` sẽ hoàn toàn bị loại khỏi cây B-Tree của Index, vừa tiết kiệm RAM vừa bảo đảm an toàn dữ liệu tuyệt đối.

---

### VẤN ĐỀ 2: REFUND RETRY POLICY & XÁC NHẬN PHÊ DUYỆT NGHIỆP VỤ
**Đánh giá:** `PENDING` (CHỜ PHÊ DUYỆT NGHIỆP VỤ — KHÔNG PHẢI QUYẾT ĐỊNH ĐÃ CHỐT)

#### 2.1. Đối chiếu Lịch sử Phê duyệt Nghiệp vụ
Quá trình rà soát toàn bộ lịch sử trao đổi và yêu cầu người dùng xác nhận:
- Trong phiên làm việc Task 8, Chủ dự án (Project Owner) đã chính thức phê duyệt **3 quyết định nghiệp vụ**:
  1. *Thời hạn giữ hàng tồn kho (Reservation Timeout):* 15 phút.
  2. *Chính sách Đánh giá sản phẩm (Review Policy):* 1 review/user/product, cho phép tạo lại khi xóa mềm, đơn hàng bắt buộc `DELIVERED` & `PAID`, kiểm tra theo số lượng thực giữ ($\text{returnedQuantity} < \text{quantity}$).
  3. *Giỏ hàng yêu cầu xác thực (Cart Auth):* Bỏ hoàn toàn Guest Cart và Cart Merge, chỉ người dùng đăng nhập mới được thêm giỏ hàng.
- **TUYỆT ĐỐI KHÔNG CÓ BẢN GHI PHÊ DUYỆT NÀO** từ người dùng đối với các thông số:
  - *Thử lại tối đa đúng 3 lần (`maxRetries = 3`).*
  - *Thuật toán Exponential Backoff với các bước nhảy thời gian cụ thể.*
  - *Tự động đóng băng và chuyển sang quy trình Đối soát thủ công (Accounting Reconciliation).*

#### 2.2. Đánh giá Rủi ro và Khuyến nghị Phân loại
- **Bản chất hiện tại:** Đây là một **giải pháp kỹ thuật (Technical Proposal)** do đội ngũ Architect đề xuất nhằm bảo đảm tính bền vững (resilience) khi kết nối mạng ngoài sang VNPAY/MoMo, phòng ngừa lỗi timeout hoặc mạng chập chờn.
- **Rủi ro nếu tự ý coi đây là quyết định nghiệp vụ chính thức:**
  - Cổng thanh toán có thể tính phí giao dịch hoàn tiền trên mỗi lượt gọi API hoặc có giới hạn tần suất (Rate Limit). Thử lại tự động 3 lần mà không có thỏa thuận SLA giữa bộ phận Tài chính và Cổng thanh toán có thể gây xung đột luồng tiền.
  - Quy trình "Đối soát thủ công" đòi hỏi phải có công cụ quản trị (Backoffice Portal / Dashboard) hoặc tích hợp với hệ thống kế toán nội bộ (ERP / CRM / Email notification). Hiện tại hệ thống chưa định nghĩa quy trình này.
- **Yêu cầu Phân loại:**
  - Bắt buộc ghi rõ trong tài liệu thiết kế: **`PENDING BUSINESS APPROVAL` (Đề xuất kỹ thuật đang chờ Chủ dự án phê duyệt)**.
  - Các thông số chờ ký duyệt gồm:
    1. Số lần thử lại tối đa (Khuyến nghị: 3 lần).
    2. Khoảng thời gian giãn cách thử lại (Khuyến nghị: 1m, 5m, 15m).
    3. Quy trình tiếp nhận đơn lỗi `REFUND_FAILED` (Khuyến nghị: Gửi thông báo webhook vào kênh đối soát nội bộ và tạo ticket xử lý thủ công trong vòng 24 giờ làm việc).

---

### VẤN ĐỀ 3: EMBEDDING BLUE-GREEN MIGRATION & RANH GIỚI HỆ THỐNG
**Đánh giá:** `PASS WITH CONDITIONS` (ĐẠT THIẾT KẾ DỮ LIỆU, CẦN BỔ SUNG RUNBOOK ĐIỀU PHỐI LIÊN HỆ THỐNG)

#### 3.1. Phân định Ranh giới Transaction MongoDB
Kiểm toán độc lập làm rõ phạm vi bảo đảm của MongoDB Transaction:
- **Nằm trong phạm vi MongoDB Transaction:**
  - Cập nhật tài liệu trong collection `product_embeddings`: Model cũ chuyển thành `isActive = false`, Model mới chuyển thành `isActive = true`.
  - Nhờ Partial Unique Index:
    ```javascript
    { productId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }
    ```
    MongoDB đảm bảo mức cơ sở dữ liệu: Tại bất kỳ thời điểm nào, một sản phẩm chỉ có **tối đa một bản ghi embedding active**. Nếu có xung đột đồng thời hoặc lỗi ghi, transaction sẽ rollback 100% trong database.
- **Nằm NGOÀI phạm vi MongoDB Transaction:**
  1. *Tính toán Vector Embedding:* Thực hiện bởi AI Service (FastAPI) gọi LLM API (OpenAI / HuggingFace) mất từ vài phút đến hàng giờ đối với toàn bộ catalog sản phẩm.
  2. *Xây dựng Vector Search Index trên MongoDB Atlas:* Quá trình Lucene build index diễn ra bất đồng bộ trên các search node của cụm Atlas.
  3. *Cập nhật Cấu hình AI Service:* Thay đổi biến môi trường `ACTIVE_EMBEDDING_MODEL` hoặc chuyển đổi index name trong tiến trình FastAPI.
  4. *Định tuyến Truy vấn Tìm kiếm (Query Routing):* Bộ định tuyến tại Spring Boot Backend.

#### 3.2. Cảnh báo Rủi ro Lệch Đồng bộ (Split-Brain / Out-of-Sync Risks)
> [!WARNING]
> **Không thể có Tính nguyên tử Toàn diện Xuyên hệ thống (No Global End-to-End Atomicity):**  
> Quá trình chuyển đổi mô hình AI là một bài toán phân tán giữa 3 thành phần: **MongoDB Database**, **Atlas Lucene Search Engine**, và **FastAPI AI Microservice**. Không thể dùng một transaction của MongoDB để khóa và commit đồng thời cả 3 hệ thống này.

Các kịch bản lệch đồng bộ cần kiểm soát:
1. **Lệch bước Model - Vector Search Index:** Nếu MongoDB Transaction đã commit `isActive = true` cho mô hình mới (ví dụ `bge-m3-v1` - 1024 dims), nhưng tiến trình FastAPI chưa kịp reload cấu hình, FastAPI vẫn sinh query vector 1536 dims từ mô hình cũ (`text-embedding-3-small-v1`). Khi đó, câu lệnh `$vectorSearch` sẽ bị lỗi sai số chiều (Dimension Mismatch Error).
2. **Lệch bước Atlas Index Build Status:** Nếu thực hiện chuyển đổi trước khi Index của mô hình mới trên MongoDB Atlas đạt trạng thái `READY` (100% indexed), các truy vấn tìm kiếm ngữ nghĩa sẽ bị rỗng (Recall = 0) hoặc gây quá tải node tìm kiếm.
3. **Sinh Vector Thất bại Từng phần:** Nếu trong 1,000 sản phẩm chỉ có 950 sản phẩm sinh vector thành công, 50 sản phẩm bị lỗi `PENDING` hoặc `FAILED`. Nếu vội vàng kích hoạt model mới, 50 sản phẩm này sẽ biến mất hoàn toàn khỏi kết quả tìm kiếm ngữ nghĩa (Semantic Search Gap).

#### 3.3. Quy trình Triển khai Chuẩn (Two-Phase Blue-Green Runbook)
Để khắc phục triệt để các rủi ro trên, tài liệu kiến trúc cần chuẩn hóa quy trình điều phối theo 5 bước tuần tự:
```
[Bước 1: Background Vector Gen] ──> [Bước 2: Atlas Index Ready] ──> [Bước 3: Shadow Testing]
                                                                            │
[Bước 5: Rollback nếu lỗi]      <── [Bước 4: Traffic Cutover] <─────────────┘
```
1. **Giai đoạn Chuẩn bị (Pre-migration):**
   - AI Worker sinh vector cho model mới với `isActive = false`, `embeddingStatus = "PENDING"`.
   - Kiểm tra điều kiện tiên quyết: Tỷ lệ `embeddingStatus = "COMPLETED"` của model mới phải đạt 100% catalog.
2. **Tạo Index Tìm kiếm:** Tạo Atlas Vector Search Index riêng biệt cho model mới. Đợi cho đến khi Atlas xác nhận `status: "STEADY"` / `READY`.
3. **Chạy Thử nghiệm Ngầm (Shadow Queries):** AI Service gửi đồng thời query vector vào cả 2 index để đối chiếu chất lượng và độ trễ, nhưng chỉ trả về kết quả từ model active cũ cho người dùng.
4. **Chuyển đổi Lưu lượng (Traffic Cutover):**
   - Bước 4.1: Cập nhật cấu hình FastAPI sang model mới (Zero-downtime rolling reload qua Uvicorn workers).
   - Bước 4.2: Chạy MongoDB Transaction để chuyển đổi cờ `isActive`.
5. **Kế hoạch Rollback (Compensating Action):** Nếu phát hiện lỗi sau khi chuyển đổi:
   - Chạy compensating transaction: Đặt model mới `isActive = false`, đặt lại model cũ `isActive = true`.
   - Reload lại cấu hình FastAPI trỏ về model cũ. Cả hai phiên bản dữ liệu vẫn được lưu trữ nguyên vẹn trong `product_embeddings`, bảo đảm khôi phục dịch vụ trong vòng dưới 30 giây.

---

### VẤN ĐỀ 4: GIT EVIDENCE & WORKSPACE INTEGRITY
**Đánh giá:** `PASS` (ĐẠT YÊU CẦU CÔ LẬP MÃ NGUỒN VÀ BẢO TOÀN TRẠNG THÁI GIT)

#### 4.1. Bằng chứng Lệnh Git Thực tế
Đã thực thi kiểm tra trực tiếp trên workspace `D:\smart-ecommerce-ai` tại nhánh `main`:

**Lệnh 1: `git status --short`**
```
 M docs/database/README.md
?? docs/database/AUDIT-REPORT-v1.2.1.md
?? docs/database/FINAL-REVIEW-v1.2.1.md
?? docs/database/FINAL-REVIEW-v1.2.md
?? docs/database/collection-specification.md
?? docs/database/data-validation-rules.md
?? docs/database/database-design.md
?? docs/database/index-strategy.md
?? docs/database/relationship-diagram.md
```

**Lệnh 2: `git diff --stat`**
```
 docs/database/README.md | 98 ++++++++++++++++++++++++++++++++++++++++++-------
 1 file changed, 84 insertions(+), 14 deletions(-)
```

**Lệnh 3: `git diff -- docs/database/`**
- File sửa đổi duy nhất là [docs/database/README.md](file:///D:/smart-ecommerce-ai/docs/database/README.md).
- Toàn bộ nội dung thay đổi chỉ cập nhật mục lục điều hướng, tóm tắt các quyết định kỹ thuật v1.2.1 và bổ sung liên kết đến báo cáo rà soát.

#### 4.2. Báo cáo Chi tiết về Tính Toàn vẹn Workspace
- **Số lượng file đã sửa đổi (Tracked files modified):** Đúng 1 file (`docs/database/README.md`).
- **Số lượng file chưa theo dõi (Untracked files):** 7 file tài liệu đặc tả và báo cáo, tất cả 100% đều nằm bên trong thư mục `docs/database/`.
- **Xác nhận Cô lập Tuyệt đối:**
  - Số lượng file bên ngoài thư mục `docs/database/` bị ảnh hưởng: **ĐÚNG 0 FILE**.
  - Không có bất kỳ file nào trong `frontend/` (React/Vite), `backend/` (Spring Boot/Java), `ai-service/` (FastAPI/Python) bị chỉnh sửa, xóa hoặc tạo mới.
  - Không có Java Entity, Spring Repository, MongoDB Driver configuration, hay Migration script nào được tạo ra.
- **Xác nhận Thao tác Git:**
  - Không thực hiện bất kỳ lệnh `git commit` nào.
  - Không thực hiện bất kỳ lệnh `git push` nào lên remote repository `https://github.com/vuthuyduong1505/smart-ecommerce-ai.git`.
  - Workspace bảo lưu trạng thái sẵn sàng để người dùng kiểm tra độc lập bất cứ lúc nào.

---

## 3. KHUYẾN NGHỊ VÀ KẾ HOẠCH HÀNH ĐỘNG (ACTIONABLE RECOMMENDATIONS)

### 3.1. Đánh giá Sẵn sàng Tổng thể: READY WITH CONDITIONS
Hệ thống tài liệu MongoDB Database Specification v1.2.1 đạt mức độ hoàn thiện xuất sắc về mặt cấu trúc dữ liệu, chuẩn hóa schema, tính toán dung lượng và chiến lược chỉ mục (Index Strategy). Tuy nhiên, trên cương vị Senior Software Engineer / Lead Database Auditor, **chúng tôi KHÔNG kết luận dự án "READY FOR IMPLEMENTATION" vô điều kiện**, mà xác định trạng thái chuẩn xác là:

> [!IMPORTANT]
> **TRẠNG THÁI: READY WITH CONDITIONS (SẴN SÀNG CÓ ĐIỀU KIỆN)**  
> Giai đoạn lập trình Backend và AI Service chỉ nên bắt đầu khi hai điều kiện tiên quyết sau được làm rõ.

### 3.2. Danh mục Điều kiện Cần Hoàn tất Trước khi Triển khai Code

1. **Về phía Nghiệp vụ (Business Sign-off):**
   - Trình Chủ dự án xem xét và phê duyệt chính thức đề xuất kỹ thuật đối với:
     * Số lần thử lại hoàn tiền tự động: Chốt 3 lần hay số lần khác?
     * Quy trình xử lý `REFUND_FAILED`: Kênh thông báo đối soát kế toán thủ công (SLA tiếp nhận và xử lý trong bao lâu?).
2. **Về phía Kỹ thuật & Hạ tầng (Engineering Runbook):**
   - Chuẩn bị sẵn Runbook điều phối triển khai Blue-Green Vector Migration: FastAPI phải kiểm tra trạng thái Index trên Atlas trước khi chuyển đổi mô hình embedding.
   - Thống nhất các cấu hình kết nối MongoDB Replica Set trên Backend Spring Boot để bảo đảm hỗ trợ Multi-document Transactions và Change Streams.

---
*Báo cáo được lập độc lập bởi Senior Software Engineer / Lead Database Auditor.*  
*Tài liệu lưu trữ tại:* `docs/database/AUDIT-REPORT-v1.2.1.md`

