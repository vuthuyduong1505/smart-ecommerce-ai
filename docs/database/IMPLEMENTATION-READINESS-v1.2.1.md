# BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG TRIỂN KHAI MÃ NGUỒN
## IMPLEMENTATION READINESS ASSESSMENT v1.2.1 — SMART E-COMMERCE AI

**Dự án:** Smart E-commerce AI  
**Vai trò:** Senior Database Architect / Distributed Systems Engineer  
**Đối tượng thẩm định:** Bộ tài liệu Database Specification v1.2.1 sau Kiểm toán Độc lập  
**Ngày lập báo cáo:** 15/11/2026  
**Trạng thái sẵn sàng tổng thể:** **READY FOR PHASED IMPLEMENTATION (SẴN SÀNG TRIỂN KHAI PHÂN KỲ CHO CÁC MODULE NỀN TẢNG — CHỜ PHÊ DUYỆT THÔNG SỐ VẬN HÀNH & KẾT QUẢ BENCHMARK)**  

---

## 1. TỔNG QUAN & KẾT QUẢ RÀ SOÁT SAU KIỂM TOÁN ĐỘC LẬP

Dựa trên kết quả từ [AUDIT-REPORT-v1.2.1.md](file:///D:/smart-ecommerce-ai/docs/database/AUDIT-REPORT-v1.2.1.md), đợt hoàn thiện kỹ thuật này tập trung khắc phục triệt để các rủi ro hệ thống phân tán, chuẩn hóa nguồn dữ liệu tin cậy (Single Source of Truth - SSOT) cho Embedding Release, hoàn thiện Blue-Green Migration Runbook 9 giai đoạn, rà soát tính duy nhất của Refund Index theo payment provider và phân định rõ phạm vi catalog triển khai AI trong giai đoạn đầu.

---

## 2. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT (APPROVED)

Các quyết định dưới đây đã được phê duyệt chính thức và đóng vai trò là các quy tắc kinh doanh bất biến (Invariants) của hệ thống:

| STT | Quyết định Nghiệp vụ | Nội dung Chi tiết Đã Phê duyệt | Trạng thái |
| :-: | :--- | :--- | :-: |
| **1** | **Thời hạn Giữ Kho (Reservation Timeout)** | - Giữ hàng trong **15 phút** kể từ thời điểm tạo đơn.<br>- Trạng thái `EXPIRED` là trạng thái kết thúc (Terminal State).<br>- Late Webhook đến sau khi hết hạn: Nếu còn hàng, tạo một `reservationId` hoàn toàn mới và ghi vết phiên cũ vào `reservationHistory`; nếu hết hàng, tự động kích hoạt luồng hoàn tiền. | **APPROVED** |
| **2** | **Chính sách Đánh giá (Review Policy)** | - Mỗi tài khoản chỉ có tối đa 1 đánh giá đang hoạt động cho mỗi sản phẩm (cho phép tạo lại khi đánh giá cũ bị xóa mềm).<br>- Đơn hàng bắt buộc phải ở trạng thái `DELIVERED` và `PAID`.<br>- **Kiểm tra theo số lượng thực giữ:** Khách hàng chỉ được đánh giá khi số lượng thực tế còn giữ lại $\text{quantity} - \text{returnedQuantity} > 0$. Nếu đã trả hàng toàn bộ ($\text{returnedQuantity} == \text{quantity}$), hủy quyền đánh giá. | **APPROVED** |
| **3** | **Giỏ hàng Xác thực (Cart Auth)** | - **Bỏ hoàn toàn Guest Cart và thao tác Cart Merge.**<br>- Chỉ người dùng đã đăng nhập mới được thêm sản phẩm vào giỏ hàng.<br>- Mỗi người dùng có duy nhất 1 giỏ hàng (`userId` bắt buộc, Unique Index `{ userId: 1 }`, quan hệ `1:0..1`). | **APPROVED** |
| **4** | **Loại bỏ Hết hạn Giỏ hàng (No Cart TTL)** | - Loại bỏ hoàn toàn đề xuất TTL Index 30 ngày (chưa được phê duyệt).<br>- Loại bỏ trường `expiresAt` khỏi collection `carts`. Giỏ hàng của người dùng được lưu trữ bền vững theo tài khoản. | **APPROVED** |

---

## 3. CÁC ĐỀ XUẤT KỸ THUẬT TIẾP TỤC CHỜ PHÊ DUYỆT (PENDING BUSINESS APPROVAL)

Các thông số vận hành hoàn tiền dưới đây **TIẾP TỤC ĐƯỢC PHÂN LOẠI CHÍNH THỨC LÀ PENDING BUSINESS APPROVAL**, tuyệt đối không tự ý coi là quyết định đã chốt:

1. **Số lần thử lại hoàn tiền tự động tối đa:** Đề xuất 3 lần (`maxRetries = 3`) — **PENDING APPROVAL**.
2. **Thuật toán và mốc thời gian Exponential Backoff:** Đề xuất các mốc 1 phút, 5 phút, 15 phút (tổng thời gian chờ ~21 phút) — **PENDING APPROVAL**.
3. **Quy trình Đối soát Thủ công (`REFUND_FAILED`):** Đề xuất kênh tiếp nhận (Dashboard Admin / Webhook thông báo nội bộ) và cam kết SLA kế toán xử lý trong vòng 24 giờ làm việc — **PENDING APPROVAL**.

### Thiết kế Kỹ thuật Linh hoạt (Flexible Software Design)
Để mã nguồn Backend Spring Boot không bị phụ thuộc cứng vào các quyết định chờ duyệt, kiến trúc sử dụng mẫu thiết kế **Strategy Pattern** và **Configuration Injection**:
- Trừu tượng hóa thông số qua `@ConfigurationProperties(prefix = "app.payment.refund")`.
- Định nghĩa interface `RefundRetryPolicy` và `AccountingReconciliationNotifier`.
- Khi Chủ dự án phê duyệt hoặc thay đổi thông số/kênh đối soát, đội ngũ phát triển chỉ cần cập nhật file cấu hình `application.yml` mà không cần chỉnh sửa hoặc compile lại mã nguồn logic cốt lõi.

```yaml
app:
  payment:
    refund:
      max-retries: 3           # Đề xuất kỹ thuật (Chờ Business duyệt)
      backoff-multiplier: 2.0  # Đề xuất kỹ thuật (Chờ Business duyệt)
      initial-interval-ms: 60000
      max-interval-ms: 900000
```

---

## 4. CƠ CHẾ QUẢN LÝ EMBEDDING RELEASE CẤP HỆ THỐNG (EMBEDDING RELEASE MANAGEMENT)

### 4.1. Phân biệt Rõ Hai Cấp độ Trạng thái Active
- **Cấp độ Product (`product_embeddings.isActive`):** Đảm bảo mỗi sản phẩm có tối đa 1 vector active trong MongoDB thông qua Partial Unique Index `{ productId: 1 }` với `{ isActive: true }`.
- **Cấp độ Toàn hệ thống (Embedding Release SSOT):** Xác định phiên bản mô hình, số chiều và tên Atlas Vector Search Index đang được phép tiếp nhận lưu lượng tìm kiếm thực tế của người dùng.

### 4.2. Đánh giá Phương án Nguồn Dữ liệu Đáng Tin cậy (SSOT Evaluation)

| Tiêu chí | Phương án 1: Config-driven SSOT (FastAPI Master + Backend Handshake) | Phương án 2: Dedicated Metadata Collection (`embedding_releases`) |
| :--- | :--- | :--- |
| **Cơ chế hoạt động** | FastAPI giữ cấu hình phát hành tập trung (qua Environment/ConfigMap). Spring Boot đồng bộ qua endpoint `GET /api/v1/ai/model-info` khi khởi động và định kỳ Health Check. | Tạo collection quản trị siêu nhẹ `embedding_releases` trong MongoDB. Cả Spring Boot và FastAPI cùng truy vấn trạng thái release từ database. |
| **Số lượng Collection** | **Giữ nguyên 14 Collections** (Không tạo thêm collection mới). | Tăng lên 15 Collections. |
| **Chống Split-Brain** | Đảm bảo qua nguyên tắc Single Master: FastAPI là nguồn sự thật duy nhất về encoder model và index; Backend chỉ là client tiêu thụ. | Đảm bảo ở mức Database qua Partial Unique Index: `{ status: 1 }` với `{ unique: true, partialFilterExpression: { status: "ACTIVE" } }`. |
| **Audit & Rollback** | Lưu vết qua cấu hình hạ tầng container / Git deployment. Rollback yêu cầu reload cấu hình FastAPI. | Lưu vết đầy đủ lịch sử: `releaseId`, `activatedAt`, `previousReleaseId`. Rollback thực thi qua câu lệnh cập nhật database. |
| **Độ trễ Truy vấn** | Bằng $0$ (100% In-memory). | Bằng $0$ nếu có In-memory Cache trong ứng dụng. |

**Quyết định Kiến trúc:**
- **Nguyên tắc cốt lõi:** Spring Boot và FastAPI **tuyệt đối không tự quản lý hai phiên bản active độc lập**.
- **Cấu trúc Release Metadata Chuẩn hóa:**
  Dù áp dụng Phương án 1 hay Phương án 2, siêu dữ liệu của mỗi đợt phát hành bắt buộc phải chuẩn hóa theo cấu trúc:
  - `releaseId`: Định danh phiên phát hành (ví dụ: `"emb-rel-20261115-01"`).
  - `model`: Tên mô hình AI (ví dụ: `"text-embedding-3-small"` hoặc `"bge-m3"`).
  - `modelVersion`: Phiên bản pipeline vector (ví dụ: `"text-embedding-3-small-v1"`).
  - `dimensions`: Số chiều vector (ví dụ: `1536` hoặc `1024`).
  - `vectorIndexName`: Tên chỉ mục tìm kiếm trên Atlas (ví dụ: `"idx_vector_search_text_embedding_3_small_1536"`).
  - `targetCategory`: Phạm vi danh mục (giai đoạn đầu là `"laptop"`).
  - `status`: Enum quản lý trạng thái (`"STAGING"`, `"SHADOW"`, `"ACTIVE"`, `"RETIRED"`, `"ROLLED_BACK"`).
  - `activatedAt`: Thời điểm kích hoạt chính thức.
  - `rolledBackAt`: Thời điểm rollback (nếu có sự cố).
  - `previousReleaseId`: Định danh release trước đó để phục vụ rollback chính xác.
- **Ràng buộc Tương thích Số chiều (Dimension Compatibility):**
  - Query Vector sinh ra từ FastAPI bắt buộc phải khớp $100\%$ với số chiều trong Atlas Vector Search Index.
  - Quy ước đặt tên bất biến: `idx_vector_search_<model_slug>_<dimensions>`.

---

## 5. BLUE-GREEN MIGRATION RUNBOOK 9 GIAI ĐOẠN HOÀN CHỈNH

> [!WARNING]
> **Không Tuyên Bố Tính Nguyên Tử Xuyên Hệ Thống (No Global Atomicity):**  
> Quá trình chuyển đổi mô hình AI diễn ra trên 4 ranh giới hệ thống độc lập:
> 1. *MongoDB Transaction:* Cập nhật tài liệu trong `product_embeddings` và `embedding_releases`.
> 2. *Trạng thái Atlas Vector Search Index:* Lucene index build bất đồng bộ trên các search node của Atlas.
> 3. *Cấu hình AI Service (FastAPI):* Tiến trình sinh vector trong bộ nhớ và worker reload.
> 4. *Định tuyến Truy vấn Spring Boot:* Logic điều hướng search query từ client đến service tương ứng.
> Do đó, quy trình bắt buộc phải tuân thủ 9 giai đoạn điều phối nghiêm ngặt.

```
[GĐ 1: Gen Embeddings] ──> [GĐ 2: Verify Gate] ──> [GĐ 3: Build Index] ──> [GĐ 4: Index Ready] ──> [GĐ 5: Shadow Test]
                                                                                                          │
[GĐ 9: Rollback]       <── [GĐ 8: Health Check] <── [GĐ 7: Cutover Thống nhất] <── [GĐ 6: Compatibility] <┘
```

### Chi tiết 9 Giai đoạn Vận hành:

1. **Giai đoạn 1: Generate Embedding cho phiên bản mới:**
   - Tạo các document vector mới với `modelVersion = "bge-m3-v1"`, `isActive = false`, `embeddingStatus = "PENDING"`.
   - AI Worker quét danh sách sản phẩm Laptop Active hợp lệ ($N_{\text{eligible}}$) và gọi API sinh vector nền.
2. **Giai đoạn 2: Xác minh số lượng Embedding thành công và thất bại (Verification Gate):**
   - Đếm thống kê: Kiểm tra $\text{count}(\text{COMPLETED}) == N_{\text{eligible}}$ và $\text{count}(\text{FAILED}) == 0$.
   - **Hard Gate:** Nếu có bất kỳ sản phẩm nào chưa hoàn thành, quy trình dừng lại để retry worker xử lý. Tuyệt đối không chuyển sang Giai đoạn 3 khi chưa đạt $100\%$ Laptop Active.
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

### Phân tích Cửa sổ Lỗi (Failure Windows) & Phục hồi Khi Dừng Giữa chừng:

| Cửa sổ Lỗi | Điểm Gãy (Failure Point) | Hậu quả nếu không xử lý | Cơ chế Khắc phục & Phục hồi |
| :--- | :--- | :--- | :--- |
| **Cửa sổ 1** | Script cutover bị crash tại Bước 7.1 (khi FastAPI đang rolling reload). | Một số worker FastAPI chạy model mới, một số chạy model cũ; MongoDB Transaction chưa chạy. | Script điều phối bắt tín hiệu process failure và tự động kích hoạt reload container FastAPI về image/cấu hình của model cũ. Hệ thống duy trì an toàn trên phiên bản cũ. |
| **Cửa sổ 2** | MongoDB Transaction tại Bước 7.2 bị `WriteConflict` hoặc rớt mạng khi commit. | MongoDB Transaction tự động `abortTransaction()`. Trạng thái database giữ nguyên vẹn 100% cho model cũ. | Compensating script lập tức reload lại FastAPI trỏ về model cũ. Không có hiện tượng split-brain. |
| **Cửa sổ 3** | MongoDB Transaction đã commit thành công nhưng tiến trình bị crash trước khi ghi nhận xong log. | Database đã kích hoạt release mới (`ACTIVE`), FastAPI đã chạy model mới, nhưng log chưa hoàn tất. | Khi script phục hồi chạy lại, nó kiểm tra trạng thái SSOT trong MongoDB (`status == "ACTIVE"`). Nhận thấy release mới đã commit, script xác nhận thành công và chuyển thẳng sang Giai đoạn 8 (Health Check), không làm gián đoạn hệ thống. |

---

## 6. XÁC ĐỊNH PHẠM VI DỮ LIỆU EMBEDDING & FALLBACK TÌM KIẾM

### 6.1. Phân biệt Rõ Ràng Các Tập Sản Phẩm
- $N_{\text{total}}$: Tổng số sản phẩm toàn sàn thương mại điện tử.
- $N_{\text{laptop}}$: Tổng số sản phẩm danh mục Laptop.
- **$N_{\text{eligible}}$ (Tập Sản phẩm Đủ Điều kiện Sinh Vector Phase 1):**
  $$N_{\text{eligible}} = \{ p \in \text{products} \mid p.\text{categorySlug} == \text{"laptop"} \land p.\text{status} == \text{"ACTIVE"} \land p.\text{isDeleted} == \text{false} \}$$

### 6.2. Quy tắc Nghiệp vụ Catalog
1. **Phạm vi hoàn thành 100%:** Chỉ tính trên $N_{\text{eligible}}$ (Laptop Active hợp lệ).
2. **Loại trừ danh mục khác:** Các sản phẩm **Phone, Tablet, Accessories** hoàn toàn **không bắt buộc và không sinh vector** trong giai đoạn đầu để tiết kiệm chi phí API và RAM của cluster Atlas.
3. **Sản phẩm Laptop không hoạt động:** Laptop có trạng thái `DRAFT`, `ARCHIVED` hoặc đã xóa mềm (`isDeleted: true`) bị loại bỏ khỏi quy trình sinh vector active.

### 6.3. Cơ chế Fallback sang Keyword Search (Safety Net)
- Đối với sản phẩm Laptop mới tạo chưa kịp sinh vector (`embeddingStatus == "PENDING"`) hoặc sinh vector thất bại (`embeddingStatus == "FAILED"`):
  - Sản phẩm **không bị ẩn hoặc biến mất** khỏi kết quả tìm kiếm.
  - **Graceful Search Fallback:** Backend Spring Boot sử dụng chiến lược tìm kiếm hỗn hợp:
    $$\text{Search Pipeline} = \text{Atlas Vector Search (Laptop có Active Vector)} \cup \text{MongoDB Text Search (Keyword Fallback)}$$
  - Câu lệnh tìm kiếm văn bản truyền thống trên MongoDB Text Index `idx_products_text_search` (`{ name: "text", tags: "text", shortDescription: "text" }`) bảo đảm khách hàng luôn tìm thấy sản phẩm thông qua tên, mã sản phẩm hoặc thông số kỹ thuật.
  - Toàn bộ danh mục Phone, Tablet, Accessories trong giai đoạn đầu sử dụng 100% cơ chế Keyword Text Search và bộ lọc đa hình này.

---

## 7. RÀ SOÁT REFUND INDEX & LỘ TRÌNH MỞ RỘNG ĐA HOÀN TIỀN

### 7.1. Phân tích Tính Duy Nhất của `gatewayRefundId`
- `gatewayRefundId` là mã giao dịch do cổng thanh toán (VNPAY / MoMo) phát hành.
- **Bản chất phân tán:** Mã này **chỉ đảm bảo duy nhất trong phạm vi từng cổng thanh toán (Locally Unique per Provider)**. Không có sự bảo đảm duy nhất toàn cầu (Globally Unique) giữa hai cổng thanh toán độc lập.
- **Đánh giá Chỉ mục Baseline v1.2.1:**
  Chỉ mục hiện hành:
  ```javascript
  db.orders.createIndex(
    { "payment.refund.gatewayRefundId": 1 },
    { unique: true, partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } } }
  );
  ```
  Vẫn được giữ nguyên theo hợp đồng kỹ thuật v1.2.1 vì định dạng ID giữa VNPAY và MoMo có cấu trúc tiền tố/độ dài khác nhau trong thực tế.
- **Đề xuất Kiến trúc Tối ưu (Zero-Collision Guarantee):**
  Để ngăn ngừa triệt để rủi ro va chạm ID giữa các cổng trong tương lai, khuyến nghị:
  - *Giải pháp Ứng dụng:* Namespace Prefixing tại Backend: `gatewayRefundId = gatewayName + ":" + rawGatewayId` (ví dụ `"VNPAY:14567890"`).
  - *Giải pháp Database:* Nâng cấp lên Compound Partial Unique Index:
    ```javascript
    db.orders.createIndex(
      { "payment.gatewayName": 1, "payment.refund.gatewayRefundId": 1 },
      { unique: true, partialFilterExpression: { "payment.refund.gatewayRefundId": { $type: "string" } } }
    );
    ```

### 7.2. Giới hạn Single Refund Object v1.2.1 & Lộ trình Mở rộng v2.0
- **Phiên bản hiện tại v1.2.1:** Giữ nguyên chính sách **một đối tượng `payment.refund` duy nhất** trên mỗi đơn hàng. Đáp ứng hoàn chỉnh kịch bản hoàn tiền chính: Late Webhook đến sau khi reservation hết hạn và hết hàng, hoặc khách hàng hủy toàn bộ đơn sau khi đã thanh toán.
- **Giới hạn kỹ thuật:** Chưa hỗ trợ kịch bản khách trả hàng nhiều lần độc lập trên cùng một đơn (Multiple Partial Refunds).
- **Lộ trình Mở rộng v2.0:** Khi mở rộng nghiệp vụ hoàn tiền nhiều lần, đối tượng đơn `payment.refund` sẽ được chuyển thành mảng `payment.refunds: Array<Object>`, kết hợp với trạng thái tổng hợp dòng tiền trên `orders.paymentStatus` (`PARTIALLY_REFUNDED`, `FULLY_REFUNDED`).

---

## 8. NHỮNG GIỚI HẠN KỸ THUẬT CÒN TỒN TẠI & VẤN ĐỀ CHƯA GIẢI QUYẾT ĐƯỢC

Trên tinh thần kiểm toán trung thực và khách quan, các vấn đề dưới đây được ghi nhận rõ là **CHƯA GIẢI QUYẾT TRIỆT ĐỂ** và không tự ý kết luận PASS:

1. **Benchmark Lựa chọn Mô hình Vector AI Chính thức:**
   - *Hiện trạng:* Chưa có dữ liệu thực nghiệm so sánh giữa `text-embedding-3-small` (1536 chiều, OpenAI) và `bge-m3` (1024 chiều, HuggingFace/Self-hosted) về độ chính xác tiếng Việt và chi phí vận hành.
   - *Phân loại:* **PENDING BENCHMARK**.
2. **Đo Kiểm Tải TTL Index Dưới Tải Cao:**
   - *Hiện trạng:* Chưa thực hiện stress test xóa bản ghi ngầm với tần suất 5,000 - 10,000 events/phút trên Replica Set.
   - *Phân loại:* **PENDING LOAD TEST**.
3. **Thời Gian Rollback Thực Tế của Quá Trình Blue-Green:**
   - *Hiện trạng:* Thời gian rollback thực tế phụ thuộc vào tốc độ rolling update của container và thời gian thực thi của MongoDB Transaction; chưa có số liệu đo lường cụ thể trên staging, không khẳng định thời gian cố định dưới 30s.
   - *Phân loại:* **PENDING STAGING MEASUREMENT**.
4. **Chính sách Xóa Giỏ hàng Không Hoạt động Dài hạn (Cart Retention):**
   - *Hiện trạng:* Chính sách xóa giỏ hàng bỏ quên sau 6 tháng hoặc 1 năm chưa được phê duyệt (hiện tại lưu trữ vĩnh viễn theo tài khoản).
   - *Phân loại:* **PENDING BUSINESS DECISION**.

---

## 9. ĐIỀU KIỆN CẦN ĐÁP ỨNG TRƯỚC KHI TRIỂN KHAI & LỘ TRÌNH PHÂN KỲ

### 9.1. Trạng thái Tổng thể: READY FOR PHASED IMPLEMENTATION
Kiến trúc cơ sở dữ liệu đã đạt mức độ hoàn thiện cao nhất ở tầng dữ liệu. Đội ngũ kỹ sư có thể bắt đầu triển khai lập trình **theo từng module nền tảng độc lập** mà không gây rủi ro kỹ thuật.

### 9.2. Phân kỳ Triển khai Mã nguồn (Phased Implementation Scope)

```
[Giai đoạn 1: Core Commerce Modules] ──> [Giai đoạn 2: Advanced Commerce] ──> [Giai đoạn 3: AI Service Integration]
  - categories, brands, users              - orders snapshot, returns              - Benchmark model AI
  - products & 2-tier inventory            - payment refund core                   - FastAPI scaffold, vector index
  - carts (authenticated only)             - reviews & rating summary              - Blue-green cutover tooling
```

1. **Giai đoạn 1 (Lập trình Ngay): Core Commerce Modules:**
   - `categories`, `brands`: Entity, DTO, Repository, CRUD cây danh mục.
   - `users`: Spring Security 6, JWT, Address Book, Session Stitching `linkedSessionIds`.
   - `products`: Đa hình thông số Laptop, Tồn kho 2 mức (`quantity`, `reserved`), Atomic reservation update.
   - `carts`: Giỏ hàng xác thực, Unique `{ userId: 1 }`, giới hạn 50 items (1..10/item), không auto-reserve.
2. **Giai đoạn 2 (Lập trình Ngay): Advanced Commerce & Operations:**
   - `orders`: Snapshot mảng items, quản lý trả hàng theo số lượng (`returnedQuantity`, `refundedQuantity`), Idempotency key.
   - `payment.refund` Core: Schema 10 trường, State machine, 2 Partial Unique Indexes, cấu hình Spring Boot `@ConfigurationProperties`.
   - `product_reviews`: Entity, Partial Unique Index hỗ trợ soft-delete, kiểm tra đơn `DELIVERED`/`PAID` và số lượng thực giữ, Atomic Rating Summary.
3. **Giai đoạn 3 (Triển khai Sau khi có Benchmark & Quyết định Phê duyệt): AI Service & Payment Integration:**
   - Thực hiện Benchmark mô hình vector trên tập dữ liệu Laptop mẫu.
   - Triển khai FastAPI AI Service trỏ vào Atlas Vector Search Index tương ứng với model đã chốt.
   - Cấu hình các thông số retry hoàn tiền và kênh đối soát thủ công sau khi có phê duyệt từ Chủ dự án.

---
*Tài liệu được lập và phê duyệt kỹ thuật bởi Senior Database Architect / Distributed Systems Engineer.*  
*Lưu trữ chính thức tại:* `docs/database/IMPLEMENTATION-READINESS-v1.2.1.md`
