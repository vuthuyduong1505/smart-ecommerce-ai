import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductFilter, PRICE_RANGES } from '../../components/product/ProductFilter';
import { ProductSort } from '../../components/product/ProductSort';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import type { Product, ProductFilterParams } from '../../types/product';
import type { Category } from '../../types/category';
import type { Brand } from '../../types/brand';

export const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state synced with URL
  const keyword = searchParams.get('keyword') || '';
  const categorySlug = searchParams.get('categorySlug') || '';
  const brandName = searchParams.get('brandName') || '';
  const useCase = searchParams.get('useCase') || '';
  const priceRangeKey = searchParams.get('priceRange') || 'ALL';
  const onlyInStock = searchParams.get('inStock') === 'true';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDirection = (searchParams.get('sortDirection') || 'DESC') as 'ASC' | 'DESC';

  // API Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Metadata filter options
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load Categories & Brands metadata once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, brs] = await Promise.all([
          categoryService.getCategories(true),
          brandService.getActiveBrands(),
        ]);
        setCategories(cats);
        setBrands(brs);
      } catch (err) {
        console.error('Lỗi tải danh mục/thương hiệu:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Compute price min/max from key
  const activePriceRange = useMemo(() => {
    return PRICE_RANGES.find((r) => r.key === priceRangeKey) || PRICE_RANGES[0];
  }, [priceRangeKey]);

  // Fetch Products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: ProductFilterParams = {
        keyword: keyword || undefined,
        categorySlug: categorySlug || undefined,
        brandName: brandName || undefined,
        useCase: useCase || undefined,
        minPrice: activePriceRange.min,
        maxPrice: activePriceRange.max,
        inStock: onlyInStock ? true : undefined,
        page,
        size: 12,
        sortBy,
        sortDirection,
      };

      const res = await productService.getProducts(filterParams);
      setProducts(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [keyword, categorySlug, brandName, useCase, activePriceRange, onlyInStock, page, sortBy, sortDirection]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper to update URL params
  const updateParams = (newParams: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'ALL') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    // Reset page to 0 when filter changes (unless page itself is changing)
    if (!('page' in newParams)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSelectCategory = (slug: string) => {
    updateParams({ categorySlug: slug });
  };

  const handleSelectBrand = (brand: string) => {
    updateParams({ brandName: brand });
  };

  const handleSelectPriceRange = (rangeKey: string) => {
    updateParams({ priceRange: rangeKey });
  };

  const handleSelectUseCase = (uc: string) => {
    updateParams({ useCase: uc });
  };

  const handleToggleInStock = (inStock: boolean) => {
    updateParams({ inStock: inStock ? 'true' : null });
  };

  const handleSortChange = (newSortBy: string, newSortDirection: 'ASC' | 'DESC') => {
    updateParams({ sortBy: newSortBy, sortDirection: newSortDirection });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage > 0 ? newPage.toString() : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    keyword || categorySlug || brandName || useCase || (priceRangeKey && priceRangeKey !== 'ALL') || onlyInStock
  );

  return (
    <div className="space-y-6">
      {/* Main Grid: Sidebar Filter + Product Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <ProductFilter
            categories={categories}
            brands={brands}
            selectedCategory={categorySlug}
            selectedBrand={brandName}
            selectedPriceRange={priceRangeKey}
            selectedUseCase={useCase}
            onlyInStock={onlyInStock}
            onSelectCategory={handleSelectCategory}
            onSelectBrand={handleSelectBrand}
            onSelectPriceRange={handleSelectPriceRange}
            onSelectUseCase={handleSelectUseCase}
            onToggleInStock={handleToggleInStock}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Product Cards Grid & States */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort & Mobile Filter Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                )}
              </button>

              {keyword && (
                <span className="text-sm font-semibold text-slate-700">
                  Kết quả cho: <span className="text-rose-600 font-bold">"{keyword}"</span>
                </span>
              )}
            </div>

            {/* Sort component */}
            <div className="ml-auto">
              <ProductSort
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Đang lọc theo:</span>

              {keyword && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                  Từ khóa: <strong>{keyword}</strong>
                  <button onClick={() => updateParams({ keyword: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {categorySlug && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                  Danh mục: <strong>{categorySlug}</strong>
                  <button onClick={() => updateParams({ categorySlug: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {brandName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                  Hãng: <strong>{brandName}</strong>
                  <button onClick={() => updateParams({ brandName: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {priceRangeKey !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                  Giá: <strong>{activePriceRange.label}</strong>
                  <button onClick={() => updateParams({ priceRange: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {useCase && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                  Nhu cầu: <strong>{useCase}</strong>
                  <button onClick={() => updateParams({ useCase: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  Chỉ còn hàng
                  <button onClick={() => updateParams({ inStock: null })} className="hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-1 cursor-pointer"
              >
                Xóa tất cả lọc
              </button>
            </div>
          )}
          {loading && <LoadingSpinner text="Đang tải danh sách laptop từ MongoDB..." />}

          {error && (
            <ErrorState
              message={error}
              onRetry={fetchProducts}
            />
          )}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Không có chiếc laptop nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn."
              actionText="Xóa toàn bộ bộ lọc"
              onAction={handleResetFilters}
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          ></div>

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-base text-slate-900">Bộ Lọc Laptop</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ProductFilter
                categories={categories}
                brands={brands}
                selectedCategory={categorySlug}
                selectedBrand={brandName}
                selectedPriceRange={priceRangeKey}
                selectedUseCase={useCase}
                onlyInStock={onlyInStock}
                onSelectCategory={(slug) => {
                  handleSelectCategory(slug);
                  setMobileFilterOpen(false);
                }}
                onSelectBrand={(b) => {
                  handleSelectBrand(b);
                  setMobileFilterOpen(false);
                }}
                onSelectPriceRange={(r) => {
                  handleSelectPriceRange(r);
                  setMobileFilterOpen(false);
                }}
                onSelectUseCase={(uc) => {
                  handleSelectUseCase(uc);
                  setMobileFilterOpen(false);
                }}
                onToggleInStock={handleToggleInStock}
                onResetFilters={() => {
                  handleResetFilters();
                  setMobileFilterOpen(false);
                }}
                hasActiveFilters={hasActiveFilters}
                className="border-0 p-0 shadow-none"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm"
            >
              Xem kết quả ({totalElements})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
