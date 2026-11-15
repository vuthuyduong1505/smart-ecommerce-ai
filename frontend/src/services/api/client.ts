import axios from 'axios';

// Ưu tiên đọc biến môi trường VITE_API_BASE_URL, mặc định fallback là '/api/v1' qua Vite proxy
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm JWT Bearer Token nếu người dùng đã đăng nhập
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartlap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Bắt lỗi 401 (hết hạn / token không hợp lệ) và chuẩn hóa thông điệp lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xóa token khi phiên đăng nhập hết hạn hoặc bị thu hồi
      localStorage.removeItem('smartlap_token');
      localStorage.removeItem('smartlap_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Đã có lỗi xảy ra khi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);
