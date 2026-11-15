# Smart E-commerce AI

**Smart E-commerce AI** là nền tảng thương mại điện tử thông minh dành cho một cửa hàng công nghệ (Single-store), tích hợp các công nghệ AI tiên tiến nhằm nâng cao trải nghiệm mua sắm thông qua tìm kiếm ngữ nghĩa, gợi ý sản phẩm cá nhân hóa và chuyên viên tư vấn bán hàng tự động (AI Product Advisor sử dụng RAG).

---

## 1. Danh mục sản phẩm & Định hướng phát triển

- **Danh mục sản phẩm kinh doanh:**
  - Laptop (trọng tâm tích hợp AI trong giai đoạn đầu)
  - Phone (Điện thoại thông minh)
  - Tablet (Máy tính bảng)
  - Accessories (Phụ kiện công nghệ)

- **Các module AI chính trong tương lai:**
  1. **E-commerce Core:** Nghiệp vụ quản lý sản phẩm, danh mục, giỏ hàng, đặt hàng, tài khoản người dùng.
  2. **Smart Search:** Tìm kiếm thông minh theo ngôn ngữ tự nhiên và ngữ nghĩa.
  3. **Personalized Recommendation:** Hệ thống gợi ý sản phẩm phù hợp với nhu cầu và hành vi khách hàng.
  4. **AI Product Advisor:** Trợ lý ảo tư vấn cấu hình sản phẩm theo nhu cầu người dùng, sử dụng kỹ thuật RAG (Retrieval-Augmented Generation) để cung cấp thông tin kỹ thuật chính xác.

---

## 2. Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Phiên bản |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | React 18 / 19, Vite, TS |
| **Backend** | Java, Spring Boot, Maven | Java 21 LTS, Spring Boot 3 |
| **AI Service** | Python, FastAPI, Uvicorn | Python 3.11, FastAPI |
| **Database** | MongoDB | (Sẽ tích hợp ở giai đoạn tiếp theo) |
| **Quản lý mã nguồn** | Git | 2.x |

---

## 3. Cấu trúc thư mục dự án

```text
smart-ecommerce-ai/
├── frontend/             # Ứng dụng Web Client (React + TypeScript + Vite)
├── backend/              # Dịch vụ Backend cốt lõi (Java 21 + Spring Boot + Maven)
├── ai-service/           # Dịch vụ Trí tuệ Nhân tạo (Python 3.11 + FastAPI)
│   └── .venv/            # Python Virtual Environment
├── docs/                 # Tài liệu kỹ thuật của dự án
│   ├── architecture/     # Tài liệu thiết kế kiến trúc hệ thống
│   ├── database/         # Thiết kế dữ liệu và schema MongoDB
│   ├── api/              # Tài liệu và đặc tả RESTful API
│   └── ai/               # Lộ trình và thiết kế RAG / Recommendation
├── data/                 # Thư mục chứa dữ liệu mẫu, catalog laptop
├── .gitignore            # Cấu hình bỏ qua tệp tin cho Git
└── README.md             # Giới thiệu tổng quan và hướng dẫn dự án
```

---

## 4. Hướng dẫn khởi chạy (Getting Started)

### 4.1. Khởi chạy Frontend
```powershell
cd frontend
npm install
npm run dev
```
Ứng dụng client sẽ khả dụng tại: `http://localhost:5173`

### 4.2. Khởi chạy Backend
Yêu cầu Java 21 LTS.
```powershell
cd backend
mvn spring-boot:run
# hoặc sử dụng wrapper nếu có:
.\mvnw.cmd spring-boot:run
```
Backend sẽ khả dụng tại: `http://localhost:8080`
- **Health Check Endpoint:** `GET http://localhost:8080/api/v1/health`

### 4.3. Khởi chạy AI Service
Yêu cầu Python 3.11.
```powershell
cd ai-service
# Kích hoạt virtual environment:
.\.venv\Scripts\Activate.ps1
# Cài đặt thư viện:
pip install -r requirements.txt
# Chạy service:
uvicorn main:app --reload --port 8000
```
AI Service sẽ khả dụng tại: `http://localhost:8000`
- **Health Check Endpoint:** `GET http://localhost:8000/health`
- **Tài liệu Swagger UI:** `GET http://localhost:8000/docs`

---

## 5. Quy ước & Lưu ý phát triển
- Tuyệt đối không commit các file môi trường `.env`, `node_modules`, `target`, thư mục ảo `.venv` lên Git.
- Mọi tài liệu kỹ thuật được cập nhật đồng bộ trong thư mục `docs/`.
