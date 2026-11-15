import axios from 'axios';

// Ưu tiên đọc biến môi trường VITE_API_BASE_URL, mặc định fallback là '/api/v1' qua Vite proxy
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Đã có lỗi xảy ra khi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

