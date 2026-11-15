import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text,
  message,
  className = '',
}) => {
  const displayText = message || text || 'Đang tải dữ liệu...';
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"></div>
      </div>
      {displayText && <p className="mt-4 text-sm font-medium text-slate-600">{displayText}</p>}
    </div>
  );
};
