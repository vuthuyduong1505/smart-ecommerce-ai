import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface ProductSortProps {
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  onSortChange: (sortBy: string, sortDirection: 'ASC' | 'DESC') => void;
  className?: string;
}

export const ProductSort: React.FC<ProductSortProps> = ({
  sortBy,
  sortDirection,
  onSortChange,
  className = '',
}) => {
  const currentKey = `${sortBy}_${sortDirection}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'createdAt_DESC') {
      onSortChange('createdAt', 'DESC');
    } else if (val === 'salePrice_ASC') {
      onSortChange('salePrice', 'ASC');
    } else if (val === 'salePrice_DESC') {
      onSortChange('salePrice', 'DESC');
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      <ArrowUpDown className="w-4 h-4 text-slate-400" />
      <span className="hidden sm:inline font-medium">Sắp xếp:</span>
      <select
        value={currentKey}
        onChange={handleChange}
        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-100 cursor-pointer shadow-2xs"
      >
        <option value="createdAt_DESC">Mới nhất</option>
        <option value="salePrice_ASC">Giá tăng dần</option>
        <option value="salePrice_DESC">Giá giảm dần</option>
      </select>
    </div>
  );
};

