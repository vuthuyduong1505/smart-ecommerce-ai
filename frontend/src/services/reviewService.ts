import { apiClient } from './api/client';
import type { ApiResponse, PageResponse } from '../types/api';
import type {
  ProductReview,
  ReviewSummary,
  ReviewEligibility,
  CreateReviewPayload,
  UpdateReviewPayload,
  ModerateReviewPayload,
} from '../types/review';

export const reviewService = {
  /**
   * Lấy danh sách đánh giá APPROVED cho trang chi tiết sản phẩm (công khai)
   */
  async getProductReviews(
    productId: string,
    params?: { rating?: number; sort?: string; page?: number; limit?: number }
  ): Promise<PageResponse<ProductReview>> {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductReview>>>(
      `/products/${productId}/reviews`,
      { params }
    );
    return res.data.data;
  },

  /**
   * Lấy thống kê số sao và phân bố điểm của sản phẩm (công khai)
   */
  async getProductReviewSummary(productId: string): Promise<ReviewSummary> {
    const res = await apiClient.get<ApiResponse<ReviewSummary>>(
      `/products/${productId}/reviews/summary`
    );
    return res.data.data;
  },

  /**
   * Kiểm tra điều kiện đánh giá của khách hàng (Verified Purchase)
   */
  async checkEligibility(productId: string): Promise<ReviewEligibility> {
    const res = await apiClient.get<ApiResponse<ReviewEligibility>>(
      `/products/${productId}/my-review-eligibility`
    );
    return res.data.data;
  },

  /**
   * Khách hàng gửi đánh giá mới
   */
  async createReview(
    productId: string,
    payload: CreateReviewPayload
  ): Promise<ProductReview> {
    const res = await apiClient.post<ApiResponse<ProductReview>>(
      `/products/${productId}/reviews`,
      payload
    );
    return res.data.data;
  },

  /**
   * Khách hàng xem lịch sử đánh giá của mình
   */
  async getMyReviews(params?: {
    page?: number;
    limit?: number;
  }): Promise<PageResponse<ProductReview>> {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductReview>>>(
      '/users/me/reviews',
      { params }
    );
    return res.data.data;
  },

  /**
   * Khách hàng chỉnh sửa đánh giá
   */
  async updateMyReview(
    reviewId: string,
    payload: UpdateReviewPayload
  ): Promise<ProductReview> {
    const res = await apiClient.put<ApiResponse<ProductReview>>(
      `/reviews/${reviewId}`,
      payload
    );
    return res.data.data;
  },

  /**
   * Khách hàng xóa mềm đánh giá
   */
  async deleteMyReview(reviewId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/reviews/${reviewId}`);
  },

  /**
   * Admin: Xem danh sách đánh giá toàn sàn (lọc theo trạng thái, sao, từ khóa)
   */
  async getAdminReviews(params?: {
    keyword?: string;
    status?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<PageResponse<ProductReview>> {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductReview>>>(
      '/admin/reviews',
      { params }
    );
    return res.data.data;
  },

  /**
   * Admin: Xem chi tiết một đánh giá
   */
  async getAdminReviewById(reviewId: string): Promise<ProductReview> {
    const res = await apiClient.get<ApiResponse<ProductReview>>(
      `/admin/reviews/${reviewId}`
    );
    return res.data.data;
  },

  /**
   * Admin: Duyệt hoặc từ chối đánh giá
   */
  async moderateReview(
    reviewId: string,
    payload: ModerateReviewPayload
  ): Promise<ProductReview> {
    const res = await apiClient.put<ApiResponse<ProductReview>>(
      `/admin/reviews/${reviewId}/moderation`,
      payload
    );
    return res.data.data;
  },
};
