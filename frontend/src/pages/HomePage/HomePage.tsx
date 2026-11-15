import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { ProductCard } from '../../components/product/ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { BrandLogo, getBrandTagline, getBrandAccentStyles } from '../../components/common/BrandLogo';
import { getCategoryVisualConfig } from '../../components/common/CategoryIcon';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';
import type { Brand } from '../../types/brand';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        productService.getProducts({ size: 8, sortBy: 'createdAt', sortDirection: 'DESC' }),
        categoryService.getCategories(true),
        brandService.getActiveBrands(),
      ]);

      setFeaturedProducts(productsRes.content);
      setCategories(categoriesRes);
      setBrands(brandsRes);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu trang chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-16">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* Loading & Error States */}
      {loading && <LoadingSpinner text="Đang đồng bộ dữ liệu từ máy chủ Catalog..." />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && (
        <>
          {/* 2. Danh mục nổi bật */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Danh Mục Nổi Bật
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 hidden sm:inline-block">
                      {categories.length} danh mục
                    </span>
                  </h2>
                </div>
              </div>
              <Link
                to="/products"
                className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {categories.map((cat) => {
                const visual = getCategoryVisualConfig(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    to={`/products?categorySlug=${cat.slug}`}
                    className={`group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xl ${visual.hoverBorder} hover:-translate-y-1.5 transition-all duration-300 text-center flex flex-col items-center justify-between overflow-hidden min-h-[145px] sm:min-h-[160px]`}
                  >
                    {/* Background glow on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-b ${visual.gradientBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                    />

                    <div className="relative z-10 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 group-hover:scale-110 flex items-center justify-center transition-all duration-300 shadow-2xs border border-slate-100 mb-2">
                      <span className={`${visual.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {visual.icon}
                      </span>
                    </div>

                    <div className="relative z-10 w-full">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                        {visual.tagline}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 3. Thương hiệu uy tín */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Thương Hiệu Laptop Hàng Đầu
                  </h2>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Phân phối chính hãng</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
              {brands.map((brand) => {
                const accent = getBrandAccentStyles(brand.name);
                const tagline = getBrandTagline(brand.name);

                return (
                  <Link
                    key={brand.id}
                    to={`/products?brandName=${encodeURIComponent(brand.name)}`}
                    className={`group relative bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs ${accent.cardBorder} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center overflow-hidden min-h-[140px] sm:min-h-[155px]`}
                  >
                    {/* Top indicator bar */}
                    <div className="w-full h-1 bg-slate-100 rounded-full mb-2 overflow-hidden">
                      <div className="w-0 group-hover:w-full h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-300" />
                    </div>

                    {/* Authentic Vector Logo */}
                    <div className="my-auto py-2 transition-transform duration-300 group-hover:scale-110">
                      <BrandLogo name={brand.name} size="md" />
                    </div>

                    {/* Brand Name & Series Tagline */}
                    <div className="w-full pt-2 border-t border-slate-100/90">
                      <span className="block text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {brand.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {tagline}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 4. Sản phẩm nổi bật */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Laptop Nổi Bật Mới Nhất
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Dữ liệu trực tiếp từ MongoDB Catalog – Đầy đủ cấu hình & tồn kho
                </p>
              </div>

              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-800 text-xs font-bold transition-all border border-slate-200/80 hover:border-rose-200"
              >
                <span>Xem tất cả {featuredProducts.length}+ mẫu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200"
              >
                <span>Xem toàn bộ danh mục Laptop</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
