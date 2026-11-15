import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { ProductCard } from '../../components/product/ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
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
    <div className="space-y-14">
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
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Danh Mục Nổi Bật
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?categorySlug=${cat.slug}`}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-rose-50 text-slate-600 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>

          {/* 3. Thương hiệu uy tín */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Thương Hiệu Laptop Hàng Đầu
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brandName=${encodeURIComponent(brand.name)}`}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center text-slate-800 font-black text-sm transition-colors">
                    {brand.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Sản phẩm nổi bật */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-600" />
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
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
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

