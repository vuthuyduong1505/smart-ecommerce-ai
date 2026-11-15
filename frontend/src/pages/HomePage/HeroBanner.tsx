import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Database, Cpu, CheckCircle2 } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white shadow-xl mb-12">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative px-6 py-12 sm:px-12 sm:py-16 lg:py-20 max-w-4xl">
        {/* Sub badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-rose-300 mb-6">
          <Database className="w-4 h-4 text-rose-400" />
          <span>Hệ Thống Catalog & Quản Lý Dữ Liệu Laptop</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-none text-white mb-6">
          Tra Cứu Dòng Laptop <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300">
            Theo Cấu Hình & Nhu Cầu
          </span>
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mb-8 leading-relaxed">
          Khám phá danh mục laptop từ Apple, Dell, Asus, Lenovo, HP, Acer, MSI. 
          Tra cứu thông số kỹ thuật chi tiết, theo dõi tình trạng kho và phân loại theo nhu cầu sử dụng thực tế.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 hover:shadow-rose-600/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Khám phá danh mục Laptop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/products?useCase=GAMING"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Phân loại Laptop Gaming</span>
          </Link>
        </div>

        {/* Features pills */}
        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dữ Liệu Catalog Chuẩn Hóa</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Thông Số Kỹ Thuật Đầy Đủ</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Theo Dõi Tồn Kho Thực Tế</span>
          </div>
        </div>
      </div>
    </div>
  );
};
