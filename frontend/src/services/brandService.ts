import { apiClient } from './api/client';
import type { ApiResponse, PageResponse } from '../types/api';
import type { Brand } from '../types/brand';

export const brandService = {
  /**
   * Lấy danh sách thương hiệu đang hoạt động
   */
  async getActiveBrands(): Promise<Brand[]> {
    const res = await apiClient.get<ApiResponse<Brand[]>>('/brands/active');
    return res.data.data;
  },

  /**
   * Lấy danh sách thương hiệu có phân trang và tìm kiếm
   */
  async getAllBrands(keyword?: string, page = 0, size = 20): Promise<PageResponse<Brand>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Brand>>>('/brands', {
      params: { keyword, page, size },
    });
    return res.data.data;
  },

  /**
   * Lấy chi tiết thương hiệu theo slug
   */
  async getBrandBySlug(slug: string): Promise<Brand> {
    const res = await apiClient.get<ApiResponse<Brand>>(`/brands/slug/${slug}`);
    return res.data.data;
  },
};

