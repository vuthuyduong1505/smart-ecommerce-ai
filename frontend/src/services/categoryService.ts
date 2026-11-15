import { apiClient } from './api/client';
import type { ApiResponse } from '../types/api';
import type { Category, CategoryTree } from '../types/category';

export const categoryService = {
  /**
   * Lấy danh sách danh mục phẳng
   */
  async getCategories(onlyActive = true): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { onlyActive },
    });
    return res.data.data;
  },

  /**
   * Lấy cây danh mục phân cấp đa tầng
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    const res = await apiClient.get<ApiResponse<CategoryTree[]>>('/categories/tree');
    return res.data.data;
  },

  /**
   * Lấy chi tiết danh mục theo slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const res = await apiClient.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return res.data.data;
  },
};

