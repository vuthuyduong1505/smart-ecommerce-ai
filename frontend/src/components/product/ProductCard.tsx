import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, HardDrive, Eye, CheckCircle2, XCircle } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatCurrency, calculateDiscountPercent } from '../../utils/formatters';
import { ProductThumbnail } from '../common/ProductThumbnail';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discountPercent = calculateDiscountPercent(product.listPrice, product.salePrice);
  const cpu = product.attributes?.cpu?.model;
  const ram = product.attributes?.ram?.capacityGb;
  const storage = product.attributes?.storage?.capacityGb;
  const display = product.attributes?.display?.sizeInches;
  const gpu = product.attributes?.gpu?.model;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      {/* Discount badge */}
      {discountPercent && (
        <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow-sm">
          -{discountPercent}%
        </div>
      )}

      {/* Stock badge */}
      <div className="absolute top-3 right-3 z-10">
        {product.inStock ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Còn hàng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200">
            <XCircle className="w-3 h-3" />
            Hết hàng
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden bg-slate-50 group">
        <ProductThumbnail
          src={product.thumbnailUrl || (product.images && product.images.length > 0 ? product.images[0] : undefined)}
          alt={product.name}
          brandName={product.brandName}
          aspectRatio="aspect-16/10"
        />
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              {product.brandName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400 capitalize">
              {product.categorySlug.replace('-', ' ')}
            </span>
          </div>

          {/* Product Name */}
          <Link to={`/products/${product.slug}`} className="block group-hover:text-rose-600 transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Compact Specs Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
            {cpu && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[140px]">{cpu}</span>
              </span>
            )}
            {ram && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                {ram}GB RAM
              </span>
            )}
            {storage && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                <HardDrive className="w-3 h-3 text-slate-400" />
                {storage >= 1000 ? `${storage / 1000}TB` : `${storage}GB`}
              </span>
            )}
            {gpu && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium truncate max-w-[140px]">
                {gpu}
              </span>
            )}
            {display && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                {display}"
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="text-base sm:text-lg font-bold text-rose-600 leading-tight">
              {formatCurrency(product.salePrice)}
            </div>
            {product.listPrice > product.salePrice && (
              <div className="text-xs text-slate-400 line-through mt-0.5">
                {formatCurrency(product.listPrice)}
              </div>
            )}
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 text-xs font-semibold transition-all duration-200"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chi tiết</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
