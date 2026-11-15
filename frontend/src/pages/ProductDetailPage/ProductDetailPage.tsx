import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import { ProductSpecTable } from '../../components/product/ProductSpecTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { formatCurrency, calculateDiscountPercent } from '../../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        const defaultImg =
          data.thumbnailUrl ||
          (data.images && data.images.length > 0 ? data.images[0] : '');
        setSelectedImage(defaultImg);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err.response?.data?.message || 'Không thể tải thông tin chi tiết sản phẩm');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const showPlaceholderActionToast = (actionName: string) => {
    setToastMessage(`Tính năng "${actionName}" sẽ được kích hoạt ở các giai đoạn tiếp theo!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner message="Đang tải thông tin chi tiết sản phẩm..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
          <XCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Sản phẩm bạn đang tìm kiếm có thể đã bị ngừng kinh doanh hoặc đường dẫn không chính xác.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-md"
          >
            Xem tất cả laptop
          </Link>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Không thể tải sản phẩm"
          message={error || 'Đã có lỗi xảy ra'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const discountPercent = calculateDiscountPercent(product.listPrice, product.salePrice);
  const images = product.images && product.images.length > 0
    ? product.images
    : product.thumbnailUrl
    ? [product.thumbnailUrl]
    : [];

  return (
    <div className="bg-slate-50/60 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-rose-600 transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link to="/products" className="hover:text-rose-600 transition-colors">
              Laptop
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Quay lại danh sách sản phẩm
          </button>
        </div>

        {/* Main Product Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Gallery */}
            <div className="lg:col-span-5 flex flex-col">
              {/* Main Image */}
              <div className="relative aspect-4/3 w-full bg-slate-50 rounded-2xl border border-slate-200/70 overflow-hidden flex items-center justify-center p-6 mb-4">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                ) : (
                  <div className="text-slate-400 text-sm font-medium">Chưa có ảnh</div>
                )}

                {discountPercent != null && discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    Giảm {discountPercent}%
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-18 h-18 rounded-xl border-2 overflow-hidden shrink-0 bg-slate-50 p-1 transition-all ${
                        selectedImage === img
                          ? 'border-rose-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Assurance Box */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Bảo hành chính hãng 12-24 tháng</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Miễn phí giao hàng toàn quốc</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>1 đổi 1 trong 30 ngày nếu lỗi</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Hỗ trợ cài đặt phần mềm AI</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Pricing */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Brand and SKU */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-md">
                  {product.brandName}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Mã SP: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                {product.name}
              </h1>

              {/* Stock status badge */}
              <div className="flex items-center gap-4 mb-6">
                {product.inStock ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Còn hàng ({product.inventory?.availableStock ?? 0} máy sẵn có)
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Tạm hết hàng
                  </div>
                )}
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500">
                  Phân loại: <strong className="text-slate-700 font-semibold">{product.categorySlug}</strong>
                </span>
              </div>

              {/* Price Block */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 mb-6">
                <div className="text-xs text-slate-500 font-medium mb-1">Giá bán ưu đãi:</div>
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-rose-600">
                    {formatCurrency(product.salePrice)}
                  </span>
                  {product.listPrice > product.salePrice && (
                    <span className="text-base text-slate-400 line-through font-medium">
                      {formatCurrency(product.listPrice)}
                    </span>
                  )}
                  {discountPercent != null && discountPercent > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-md">
                      Tiết kiệm {discountPercent}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  * Đã bao gồm thuế VAT và chế độ bảo hành chuẩn của hãng.
                </div>
              </div>

              {/* Key Specs Highlights */}
              {product.attributes && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Thông số nổi bật:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {product.attributes.cpu?.model && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">CPU</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">{product.attributes.cpu.model}</span>
                      </div>
                    )}
                    {product.attributes.ram?.capacityGb && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">RAM</span>
                        <span className="font-semibold text-slate-800">
                          {product.attributes.ram.capacityGb} GB {product.attributes.ram.ramType || ''}
                        </span>
                      </div>
                    )}
                    {product.attributes.storage?.capacityGb && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Ổ cứng</span>
                        <span className="font-semibold text-slate-800">
                          {product.attributes.storage.capacityGb >= 1000
                            ? `${product.attributes.storage.capacityGb / 1000} TB`
                            : `${product.attributes.storage.capacityGb} GB`} {product.attributes.storage.storageType || ''}
                        </span>
                      </div>
                    )}
                    {product.attributes.gpu?.model && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">GPU</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">{product.attributes.gpu.model}</span>
                      </div>
                    )}
                    {product.attributes.display?.sizeInches && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Màn hình</span>
                        <span className="font-semibold text-slate-800">
                          {product.attributes.display.sizeInches}" {product.attributes.display.resolution || ''}
                        </span>
                      </div>
                    )}
                    {product.attributes.physical?.weightKg && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Trọng lượng</span>
                        <span className="font-semibold text-slate-800">
                          {product.attributes.physical.weightKg} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {product.shortDescription && (
                <div className="mb-6 text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {product.shortDescription}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => showPlaceholderActionToast('Thêm vào giỏ hàng')}
                  disabled={!product.inStock}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold border-2 border-rose-600 text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Thêm vào giỏ hàng
                </button>
                <button
                  type="button"
                  onClick={() => showPlaceholderActionToast('Mua ngay')}
                  disabled={!product.inStock}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  Mua ngay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      showPlaceholderActionToast('Đã sao chép liên kết vào bộ nhớ tạm');
                    }
                  }}
                  title="Chia sẻ sản phẩm"
                  className="p-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Specs & Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Full Description */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Đặc điểm nổi bật & Mô tả chi tiết
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
              {product.description ? (
                <div className="whitespace-pre-line">{product.description}</div>
              ) : (
                <p>
                  Sản phẩm <strong>{product.name}</strong> đến từ thương hiệu <strong>{product.brandName}</strong> được trang bị cấu hình tối ưu phục vụ nhu cầu làm việc, học tập và giải trí chuyên nghiệp. Thiết kế hiện đại, độ bền cao cùng hệ thống tản nhiệt tối ưu mang đến trải nghiệm làm việc mượt mà và bền bỉ trong suốt thời gian dài.
                </p>
              )}
            </div>

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Thẻ từ khóa:</span>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Full Specifications Table */}
          <div className="lg:col-span-5">
            <ProductSpecTable attributes={product.attributes} />
          </div>
        </div>
      </div>
    </div>
  );
};
