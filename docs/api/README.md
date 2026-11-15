# Đặc tả API (API Specifications)

## 1. Chuẩn thiết kế API
- Kiến trúc chuẩn RESTful API.
- Định dạng dữ liệu: JSON (`application/json`).
- Phiên bản hóa API: Tiền tố `/api/v1/` đối với Backend, `/api/v1/` hoặc `/health` đối với AI Service.

## 2. Danh sách Health Endpoints (Hiện tại)
### Backend
- **Endpoint:** `GET /api/v1/health`
- **Mô tả:** Kiểm tra trạng thái hoạt động của Spring Boot backend.
- **Phản hồi mẫu (200 OK):**
```json
{
  "status": "UP",
  "service": "smart-ecommerce-backend",
  "version": "0.0.1-SNAPSHOT",
  "timestamp": "2026-11-15T10:00:00Z"
}
```

### AI Service
- **Endpoint:** `GET /health`
- **Mô tả:** Kiểm tra trạng thái hoạt động của FastAPI service.
- **Phản hồi mẫu (200 OK):**
```json
{
  "status": "UP",
  "service": "smart-ecommerce-ai-service",
  "version": "0.1.0"
}
```

## 3. Các API dự kiến trong tương lai
- **Sản phẩm:** `GET /api/v1/products`, `GET /api/v1/products/{id}`
- **Danh mục:** `GET /api/v1/categories`
- **Tìm kiếm thông minh (Smart Search):** `POST /api/v1/search/smart`
- **Gợi ý sản phẩm (Recommendation):** `GET /api/v1/recommendations/user/{id}`
- **AI Product Advisor (RAG):** `POST /api/v1/ai/advisor/chat`

