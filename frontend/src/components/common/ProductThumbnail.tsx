import React, { useState } from 'react';
import { Laptop } from 'lucide-react';

interface ProductThumbnailProps {
  src?: string;
  alt: string;
  brandName?: string;
  className?: string;
  aspectRatio?: string;
  isDetail?: boolean;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  src,
  alt,
  brandName = '',
  className = '',
  aspectRatio = 'aspect-4/3',
  isDetail = false,
}) => {
  // Kiểm tra nếu URL là domain mẫu (cdn.example.com) hoặc rỗng thì dùng placeholder ngay, tránh request lỗi
  const isDummyUrl = !src || src.includes('example.com');
  const [imgError, setImgError] = useState(isDummyUrl);

  if (imgError || !src) {
    return (
      <div
        className={`relative w-full ${aspectRatio} bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/60 flex flex-col items-center justify-center p-6 text-center overflow-hidden border border-slate-200/60 rounded-xl select-none ${className}`}
      >
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        {/* Laptop Illustration SVG */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative mb-3 group-hover:scale-105 transition-transform duration-300">
            {/* Screen */}
            <div className={`${isDetail ? 'w-36 h-24' : 'w-24 h-16'} rounded-t-lg bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center p-2 shadow-md relative`}>
              {/* Screen Content */}
              <div className="w-full h-full bg-slate-950 rounded flex flex-col items-center justify-center text-rose-500/80">
                <Laptop className={`${isDetail ? 'w-8 h-8' : 'w-5 h-5'} opacity-75`} />
                {brandName && (
                  <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 mt-1">
                    {brandName}
                  </span>
                )}
              </div>
              {/* Camera dot */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-600" />
            </div>
            {/* Base / Keyboard */}
            <div className={`${isDetail ? 'w-44 h-3.5' : 'w-30 h-2.5'} -mx-4 rounded-b-md bg-gradient-to-b from-slate-300 to-slate-400 border-t border-slate-200 shadow-sm flex items-center justify-center`}>
              <div className="w-8 h-1 bg-slate-400/60 rounded-full" />
            </div>
          </div>

          {/* Model info or placeholder label */}
          <div className="text-center px-2">
            <span className="inline-block px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {brandName || 'Laptop'}
            </span>
            <p className="text-[11px] font-medium text-slate-400 line-clamp-1 max-w-[200px]">
              {alt}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5 italic">
              (Hình ảnh minh họa)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden bg-slate-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        onError={() => setImgError(true)}
      />
    </div>
  );
};
