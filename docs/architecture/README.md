# Kiến trúc Hệ thống Smart E-commerce AI

## 1. Tổng quan kiến trúc
Hệ thống Smart E-commerce AI được thiết kế theo mô hình kiến trúc phân tầng (Layered Modular Architecture) cho một cửa hàng đơn (Single-store), phân tách rõ ràng giữa:
- **Presentation Layer (Frontend):** React + TypeScript + Vite.
- **Business Core Layer (Backend):** Java 21 + Spring Boot 3 + Maven.
- **AI Intelligence Layer (AI Service):** Python 3.11 + FastAPI.
- **Persistence Layer:** MongoDB (sẽ tích hợp ở giai đoạn tiếp theo).

```
                      +-----------------------------+
                      |   Client Browser (React TS) |
                      +--------------+--------------+
                                     |
                                     | HTTP/REST
                                     v
                      +-----------------------------+
                      |   Spring Boot Backend       |
                      |   (Core Business Logic)     |
                      +-------+--------------+------+
                              |              |
                    HTTP/REST |              | Database Driver
                              v              v
               +-------------------+   +-------------------+
               |  FastAPI AI Svc   |   |     MongoDB       |
               |  (Search/RAG/Rec) |   |  (Products/Users) |
               +-------------------+   +-------------------+
```

## 2. Phân nhiệm các thành phần
1. **Frontend:** Giao diện người dùng thương mại điện tử trực quan, tương tác tìm kiếm và chat tư vấn AI.
2. **Backend:** Quản lý sản phẩm, danh mục, đơn hàng, người dùng, xác thực, và điều phối yêu cầu AI.
3. **AI Service:** Cung cấp các khả năng thông minh: Smart Search, gợi ý cá nhân hóa (Recommendation) và AI Product Advisor (RAG) tập trung vào danh mục Laptop.
4. **Database:** Lưu trữ dữ liệu danh mục, sản phẩm, thông số kỹ thuật chi tiết của Laptop, thông tin đơn hàng và lịch sử tương tác.

