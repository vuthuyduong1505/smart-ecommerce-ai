import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import type { Category } from '../../types/category';
import type { Brand } from '../../types/brand';

interface ProductFilterProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory: string;
  selectedBrand: string;
  selectedPriceRange: string;
  selectedUseCase: string;
  onlyInStock: boolean;
  onSelectCategory: (slug: string) => void;
  onSelectBrand: (brandName: string) => void;
  onSelectPriceRange: (rangeKey: string) => void;
  onSelectUseCase: (useCase: string) => void;
  onToggleInStock: (inStock: boolean) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const PRICE_RANGES = [
  { key: 'ALL', label: 'Tất cả mức giá', min: undefined, max: undefined },
  { key: 'UNDER_15', label: 'Dưới 15 triệu', min: undefined, max: 15000000 },
  { key: '15_TO_25', label: '15 - 25 triệu', min: 15000000, max: 25000000 },
  { key: '25_TO_40', label: '25 - 40 triệu', min: 25000000, max: 40000000 },
  { key: 'OVER_40', label: 'Trên 40 triệu', min: 40000000, max: undefined },
];

export const USE_CASES = [
  { key: 'ALL', label: 'Tất cả nhu cầu' },
  { key: 'GAMING', label: 'Gaming & Đồ họa nặng' },
  { key: 'OFFICE', label: 'Văn phòng - Học tập' },
  { key: 'THIN_LIGHT', label: 'Mỏng nhẹ cao cấp' },
  { key: 'CREATIVE_DESIGN', label: 'Thiết kế & Sáng tạo' },
  { key: 'DATA_AI', label: 'Khoa học dữ liệu / AI' },
];

export const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  selectedPriceRange,
  selectedUseCase,
  onlyInStock,
  onSelectCategory,
  onSelectBrand,
  onSelectPriceRange,
  onSelectUseCase,
  onToggleInStock,
  onResetFilters,
  hasActiveFilters,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <Filter className="w-5 h-5 text-rose-600" />
          <span>Bộ Lọc Sản Phẩm</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Danh mục
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              !selectedCategory
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Brand Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Thương hiệu
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectBrand('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              !selectedBrand
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(brand.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedBrand.toLowerCase() === brand.name.toLowerCase()
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Price Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Khoảng giá
        </h4>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const isChecked = selectedPriceRange === range.key;
            return (
              <label
                key={range.key}
                className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 py-1"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={isChecked}
                  onChange={() => onSelectPriceRange(range.key)}
                  className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                />
                <span className={isChecked ? 'font-semibold text-rose-600' : ''}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Use Case Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Nhu cầu sử dụng
        </h4>
        <div className="space-y-1.5">
          {USE_CASES.map((uc) => {
            const isChecked = (selectedUseCase || 'ALL') === uc.key;
            return (
              <label
                key={uc.key}
                className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 py-1"
              >
                <input
                  type="radio"
                  name="useCase"
                  checked={isChecked}
                  onChange={() => onSelectUseCase(uc.key === 'ALL' ? '' : uc.key)}
                  className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                />
                <span className={isChecked ? 'font-semibold text-rose-600' : ''}>
                  {uc.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. In Stock Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <span>Chỉ hiện máy còn hàng</span>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 text-rose-600 rounded-sm border-slate-300 focus:ring-rose-500"
          />
        </label>
      </div>
    </div>
  );
};

