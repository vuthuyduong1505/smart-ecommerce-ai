import { apiClient } from './api/client';
import type { ApiResponse, PageResponse } from '../types/api';
import type {
  OrderResponse,
  CheckoutRequest,
  UpdateOrderStatusRequest,
} from '../types/order';

export const orderService = {
  /**
   * Tiến hành đặt hàng COD từ giỏ hàng hiện tại
   */
  async checkout(data: CheckoutRequest): Promise<OrderResponse> {
    const res = await apiClient.post<ApiResponse<OrderResponse>>('/orders/checkout', data);
    return res.data.data;
  },

  /**
   * Khách hàng xem danh sách đơn hàng của mình
   */
  async getMyOrders(params?: { page?: number; size?: number }): Promise<PageResponse<OrderResponse>> {
    const res = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>('/orders', { params });
    return res.data.data;
  },

  /**
   * Khách hàng xem chi tiết 1 đơn hàng
   */
  async getMyOrderById(id: string): Promise<OrderResponse> {
    const res = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
    return res.data.data;
  },

  /**
   * Khách hàng hủy đơn hàng (khi PENDING hoặc CONFIRMED)
   */
  async cancelMyOrder(id: string): Promise<OrderResponse> {
    const res = await apiClient.post<ApiResponse<OrderResponse>>(`/orders/${id}/cancel`);
    return res.data.data;
  },

  /**
   * Admin: Lấy danh sách đơn hàng toàn hệ thống
   */
  async getAdminOrders(params?: {
    keyword?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<OrderResponse>> {
    const res = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>('/admin/orders', { params });
    return res.data.data;
  },

  /**
   * Admin: Xem chi tiết đơn hàng
   */
  async getAdminOrderById(id: string): Promise<OrderResponse> {
    const res = await apiClient.get<ApiResponse<OrderResponse>>(`/admin/orders/${id}`);
    return res.data.data;
  },

  /**
   * Admin: Cập nhật trạng thái đơn hàng
   */
  async updateAdminOrderStatus(id: string, data: UpdateOrderStatusRequest): Promise<OrderResponse> {
    const res = await apiClient.put<ApiResponse<OrderResponse>>(`/admin/orders/${id}/status`, data);
    return res.data.data;
  },
};
