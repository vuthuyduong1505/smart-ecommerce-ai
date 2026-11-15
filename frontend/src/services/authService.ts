import { apiClient } from './api/client';
import type { ApiResponse, PageResponse } from '../types/api';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/auth';

export const authService = {
  /**
   * Đăng ký tài khoản mới (Mặc định quyền ROLE_CUSTOMER)
   */
  async register(data: RegisterRequest): Promise<User> {
    const res = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return res.data.data;
  },

  /**
   * Đăng nhập hệ thống & nhận JWT Access Token
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  /**
   * Đăng xuất tài khoản
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/auth/logout');
    } catch {
      // Vẫn tiến hành xóa token ở client ngay cả khi máy chủ offline
    }
  },

  /**
   * Lấy thông tin tài khoản người dùng hiện tại
   */
  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/users/me');
    return res.data.data;
  },

  /**
   * Cập nhật thông tin cá nhân (Họ tên, SĐT)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>('/users/me', data);
    return res.data.data;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put<ApiResponse<void>>('/users/me/password', data);
  },

  /**
   * Admin: Lấy danh sách người dùng phân trang
   */
  async getAdminUsers(params?: { keyword?: string; page?: number; size?: number }): Promise<PageResponse<User>> {
    const res = await apiClient.get<ApiResponse<PageResponse<User>>>('/admin/users', { params });
    return res.data.data;
  },

  /**
   * Admin: Cập nhật trạng thái người dùng (ACTIVE / LOCKED)
   */
  async updateAdminUserStatus(id: string, status: string): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/status`, { status });
    return res.data.data;
  },
};
