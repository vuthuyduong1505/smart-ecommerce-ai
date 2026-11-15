# Tài liệu & Lộ trình Module Trí tuệ Nhân tạo (AI Service)

## 1. Định hướng phát triển AI
Giai đoạn đầu, AI Service tập trung hỗ trợ danh mục **Laptop**, sau đó mở rộng sang Phone, Tablet và Accessories.

## 2. Các tính năng AI cốt lõi
1. **Smart Search:**
   - Tìm kiếm ngữ nghĩa (Semantic Search) kết hợp Full-text Search.
   - Hiểu ý định người dùng (ví dụ: "laptop mỏng nhẹ văn phòng pin trâu dưới 20 triệu").
2. **Personalized Recommendation:**
   - Gợi ý sản phẩm dựa trên hành vi xem hàng, sản phẩm tương tự (Content-based filtering) và phối phụ kiện (Cross-selling).
3. **AI Product Advisor (RAG - Retrieval-Augmented Generation):**
   - Đóng vai trò chuyên viên tư vấn cấu hình laptop trực tuyến.
   - Sử dụng kỹ thuật RAG: Tìm kiếm thông số kỹ thuật chính xác từ cơ sở dữ liệu laptop và đưa vào ngữ cảnh LLM để trả lời khách hàng, loại bỏ hiện tượng bịa đặt thông tin (Hallucination).

## 3. Kiến trúc kỹ thuật AI Service
- **Framework:** FastAPI + Python 3.11.
- **Server:** Uvicorn ASGI Server.
- **Mô hình tích hợp tương lai:** LLM, Embedding model, Vector Store (FAISS/ChromaDB/MongoDB Atlas Vector Search).
