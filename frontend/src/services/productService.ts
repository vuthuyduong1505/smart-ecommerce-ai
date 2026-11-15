import { apiClient } from './api/client';
import type { ApiResponse, PageResponse } from '../types/api';
import type { Product, ProductFilterParams } from '../types/product';

export const productService = {
  /**
   * Lấy danh sách sản phẩm với các bộ lọc đa tiêu chí và phân trang
   */
  async getProducts(params?: ProductFilterParams): Promise<PageResponse<Product>> {
    // Làm sạch params rỗng hoặc undefined
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });
    }

    const res = await apiClient.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: cleanParams,
    });
    return res.data.data;
  },

  /**
   * Lấy chi tiết sản phẩm theo ID
   */
  async getProductById(id: string): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  /**
   * Lấy chi tiết sản phẩm theo Slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`);
    return res.data.data;
  },
};

