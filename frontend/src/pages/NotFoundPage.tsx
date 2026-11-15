import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
      <div className="text-center max-w-lg mx-auto">
        <div className="text-8xl font-black text-rose-600/20 mb-2 select-none tracking-widest font-mono">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          Trang không tồn tại
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đến một địa chỉ khác. Hãy quay về trang chủ hoặc tìm kiếm sản phẩm khác.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20"
          >
            <Home className="w-4 h-4" /> Về Trang Chủ
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <Search className="w-4 h-4" /> Danh Sách Laptop
          </Link>
        </div>
      </div>
    </div>
  );
};
