import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      if (currentPage <= 2) {
        start = 1;
        end = 3;
      } else if (currentPage >= totalPages - 3) {
        start = totalPages - 4;
        end = totalPages - 2;
      }

      if (start > 1) pages.push('...');
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 2) pages.push('...');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 ${className}`}>
      {totalElements != null && (
        <p className="text-sm text-slate-500">
          Hiển thị trang <span className="font-semibold text-slate-900">{currentPage + 1}</span> /{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng{' '}
          <span className="font-semibold text-slate-900">{totalElements}</span> sản phẩm)
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span key={`dots-${idx}`} className="px-3 py-1.5 text-slate-400 font-medium">
                ...
              </span>
            );
          }

          const isActive = item === currentPage;
          return (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item + 1}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang sau"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

