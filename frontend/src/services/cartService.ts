import { apiClient } from './api/client';
import type { ApiResponse } from '../types/api';
import type {
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../types/cart';

export const cartService = {
  /**
   * Lấy giỏ hàng của người dùng hiện tại
   */
  async getCart(): Promise<CartResponse> {
    const res = await apiClient.get<ApiResponse<CartResponse>>('/cart');
    return res.data.data;
  },

  /**
   * Thêm sản phẩm vào giỏ
   */
  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const res = await apiClient.post<ApiResponse<CartResponse>>('/cart/items', data);
    return res.data.data;
  },

  /**
   * Cập nhật số lượng 1 sản phẩm trong giỏ
   */
  async updateCartItem(productId: string, data: UpdateCartItemRequest): Promise<CartResponse> {
    const res = await apiClient.put<ApiResponse<CartResponse>>(`/cart/items/${productId}`, data);
    return res.data.data;
  },

  /**
   * Xóa 1 sản phẩm khỏi giỏ
   */
  async removeCartItem(productId: string): Promise<CartResponse> {
    const res = await apiClient.delete<ApiResponse<CartResponse>>(`/cart/items/${productId}`);
    return res.data.data;
  },

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(): Promise<CartResponse> {
    const res = await apiClient.delete<ApiResponse<CartResponse>>('/cart');
    return res.data.data;
  },
};
