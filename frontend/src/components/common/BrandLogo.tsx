import React from 'react';

interface BrandLogoProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ name, className = '', size = 'md' }) => {
  const normalized = name.toLowerCase().trim();

  // Size configurations
  const heightClass = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-10' : 'h-8';

  switch (normalized) {
    case 'apple':
      return (
        <div className={`flex items-center justify-center text-slate-900 group-hover:text-black transition-colors ${className}`}>
          <svg viewBox="0 0 170 170" className={`${heightClass} w-auto fill-current`}>
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.42-6.19-9.52-10.9-20.08-14.13-31.67-3.23-11.6-4.85-22.37-4.85-32.32 0-14.37 3.58-26.24 10.74-35.61 7.16-9.37 16.32-14.16 27.48-14.37 5.76 0 11.78 1.45 18.06 4.35 6.28 2.9 10.42 4.41 12.42 4.54 1.76-.13 6.13-1.68 13.12-4.66 6.99-2.97 13.06-4.3 18.2-3.99 13.88.75 24.63 5.72 32.25 14.92-12.18 7.37-18.15 17.52-17.9 30.45.25 10.15 4.14 18.66 11.67 25.53 7.54 6.87 16.51 10.63 26.93 11.27-2.31 7.14-5.37 14.4-9.17 21.78zm-30.82-123.63c0 7.42-2.73 14.54-8.19 21.36-6.49 7.9-14.48 12.56-23.97 13.98.13-1.76.2-3.27.2-4.54 0-7.14 2.89-14.28 8.67-21.43 2.89-3.57 6.42-6.62 10.6-9.15 4.18-2.53 8.35-4.08 12.5-4.66.13 1.5.19 3.01.19 4.44z" />
          </svg>
        </div>
      );

    case 'dell':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#0076CE] group-hover:scale-105 transition-transform bg-white shadow-2xs">
            <span className="font-black text-[#0076CE] text-xs tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
              DE<span className="inline-block -rotate-20">L</span>L
            </span>
          </div>
        </div>
      );

    case 'asus':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="px-2.5 py-1 bg-slate-900 group-hover:bg-[#00539B] rounded-lg transition-colors shadow-2xs">
            <span className="font-black text-white text-xs sm:text-sm tracking-widest uppercase font-mono">
              ASUS
            </span>
          </div>
        </div>
      );

    case 'hp':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="w-10 h-10 rounded-full bg-[#0096D6] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <span className="text-white font-black italic text-base -mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
              hp
            </span>
          </div>
        </div>
      );

    case 'lenovo':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="bg-[#E2231A] px-2.5 py-1 rounded shadow-2xs group-hover:brightness-110 transition-all">
            <span className="text-white font-black text-xs sm:text-sm tracking-tight lowercase">
              lenovo
            </span>
          </div>
        </div>
      );

    case 'acer':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="px-2 py-0.5 rounded border border-[#83B81A]/40 bg-[#83B81A]/10 group-hover:bg-[#83B81A] transition-colors">
            <span className="font-black text-[#608712] group-hover:text-white text-xs sm:text-sm tracking-normal lowercase font-sans transition-colors">
              acer
            </span>
          </div>
        </div>
      );

    case 'msi':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <div className="px-2.5 py-1 bg-black group-hover:bg-[#ED1C24] rounded-lg transition-colors shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24] group-hover:bg-white animate-pulse" />
            <span className="font-black text-white italic text-xs sm:text-sm tracking-wider uppercase font-mono">
              MSI
            </span>
          </div>
        </div>
      );

    default:
      return (
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center font-black text-sm shadow-2xs ${className}`}>
          {name.substring(0, 2).toUpperCase()}
        </div>
      );
  }
};

/**
 * Trả về slogan hoặc dòng sản phẩm nổi bật của thương hiệu
 */
export const getBrandTagline = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  switch (normalized) {
    case 'apple':
      return 'MacBook Pro & Air';
    case 'dell':
      return 'XPS & Inspiron';
    case 'asus':
      return 'ROG & ZenBook';
    case 'hp':
      return 'Spectre & Pavilion';
    case 'lenovo':
      return 'ThinkPad & Legion';
    case 'acer':
      return 'Predator & Swift';
    case 'msi':
      return 'Gaming & Creator';
    default:
      return 'Laptop chính hãng';
  }
};

/**
 * Trả về màu viền và màu nền gradient nổi bật khi hover cho từng thương hiệu
 */
export const getBrandAccentStyles = (name: string) => {
  const normalized = name.toLowerCase().trim();
  switch (normalized) {
    case 'apple':
      return {
        cardBorder: 'hover:border-slate-800',
        badgeBg: 'bg-slate-100 text-slate-800',
        badgeHover: 'group-hover:bg-slate-900 group-hover:text-white',
      };
    case 'dell':
      return {
        cardBorder: 'hover:border-[#0076CE]',
        badgeBg: 'bg-blue-50 text-[#0076CE]',
        badgeHover: 'group-hover:bg-[#0076CE] group-hover:text-white',
      };
    case 'asus':
      return {
        cardBorder: 'hover:border-[#00539B]',
        badgeBg: 'bg-sky-50 text-[#00539B]',
        badgeHover: 'group-hover:bg-[#00539B] group-hover:text-white',
      };
    case 'hp':
      return {
        cardBorder: 'hover:border-[#0096D6]',
        badgeBg: 'bg-cyan-50 text-[#0096D6]',
        badgeHover: 'group-hover:bg-[#0096D6] group-hover:text-white',
      };
    case 'lenovo':
      return {
        cardBorder: 'hover:border-[#E2231A]',
        badgeBg: 'bg-rose-50 text-[#E2231A]',
        badgeHover: 'group-hover:bg-[#E2231A] group-hover:text-white',
      };
    case 'acer':
      return {
        cardBorder: 'hover:border-[#83B81A]',
        badgeBg: 'bg-lime-50 text-[#54790e]',
        badgeHover: 'group-hover:bg-[#83B81A] group-hover:text-white',
      };
    case 'msi':
      return {
        cardBorder: 'hover:border-[#ED1C24]',
        badgeBg: 'bg-red-50 text-[#ED1C24]',
        badgeHover: 'group-hover:bg-[#ED1C24] group-hover:text-white',
      };
    default:
      return {
        cardBorder: 'hover:border-rose-400',
        badgeBg: 'bg-rose-50 text-rose-600',
        badgeHover: 'group-hover:bg-rose-600 group-hover:text-white',
      };
  }
};
