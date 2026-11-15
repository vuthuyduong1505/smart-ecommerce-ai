# Thiết kế Cơ sở dữ liệu (MongoDB)

## 1. Công nghệ lựa chọn
- **Cơ sở dữ liệu chính:** MongoDB.
- **Lý do lựa chọn:**
  - Dữ liệu sản phẩm thương mại điện tử (đặc biệt là Laptop, Phone, Tablet, Accessories) có thông số kỹ thuật dạng schema-less linh hoạt giữa các dòng máy.
  - Phù hợp lưu trữ tài liệu cấu trúc JSON lồng nhau (CPU, RAM, GPU, Màn hình, Cổng kết nối,...).

## 2. Các Collection dự kiến
1. `products`: Lưu trữ thông tin sản phẩm (Laptop, Phone, Tablet, Phụ kiện). Riêng Laptop có cấu trúc thuộc tính kỹ thuật chi tiết phục vụ cho AI RAG.
2. `categories`: Danh mục sản phẩm (Laptop, Phone, Tablet, Accessories).
3. `users`: Thông tin người dùng, tài khoản và lịch sử sở thích.
4. `orders`: Thông tin đơn đặt hàng và trạng thái đơn hàng.
5. `chat_histories`: Lịch sử hội thoại tư vấn AI Product Advisor giữa khách hàng và chatbot.
6. `recommendation_logs`: Log hành vi xem, bấm, mua để huấn luyện và phục vụ mô hình gợi ý.

> **Lưu ý:** Giai đoạn khởi tạo nền tảng này chưa cấu hình kết nối MongoDB vào backend; tài liệu này định hướng cho giai đoạn tích hợp tiếp theo.
