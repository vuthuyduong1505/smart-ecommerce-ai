import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
      <div className="text-center max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-6 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="text-6xl font-black text-amber-600/30 mb-2 select-none tracking-widest font-mono">
          403
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          Truy cập bị từ chối
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Bạn không có quyền truy cập vào khu vực này. Trang này chỉ dành cho tài khoản có quyền quản trị viên (Admin).
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20"
          >
            <Home className="w-4 h-4" /> Về Trang Chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại
          </button>
        </div>
      </div>
    </div>
  );
};
