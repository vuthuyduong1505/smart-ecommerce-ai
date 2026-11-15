import React from 'react';
import { Laptop, ShieldCheck, Truck, RotateCcw, Headphones, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Policy banner */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-500 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Miễn phí vận chuyển</h4>
                <p className="text-xs text-slate-400 mt-0.5">Giao nhanh toàn quốc trong 2-4h</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Chính hãng 100%</h4>
                <p className="text-xs text-slate-400 mt-0.5">Cam kết xuất xứ & bảo hành 1 đổi 1</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-500 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Đổi trả 30 ngày</h4>
                <p className="text-xs text-slate-400 mt-0.5">Thủ tục nhanh chóng nếu có lỗi</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-500 shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Advisor 24/7</h4>
                <p className="text-xs text-slate-400 mt-0.5">Hỗ trợ tư vấn thông minh mọi lúc</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                SMART<span className="text-rose-500">LAP</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống bán lẻ laptop thông minh thế hệ mới, ứng dụng AI trong tìm kiếm và đề xuất cá nhân hóa.
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <p>Hotline tư vấn: <span className="text-white font-semibold">1800 6969</span> (8h00 - 21h30)</p>
              <p>Email: <span className="text-white font-semibold">support@smartecommerce.local</span></p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Danh Mục Laptop</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/products?useCase=GAMING" className="hover:text-white transition-colors">Laptop Gaming & Đồ họa</Link></li>
              <li><Link to="/products?useCase=OFFICE" className="hover:text-white transition-colors">Laptop Văn phòng & Học tập</Link></li>
              <li><Link to="/products?useCase=THIN_LIGHT" className="hover:text-white transition-colors">Laptop Mỏng nhẹ cao cấp</Link></li>
              <li><Link to="/products?useCase=CREATIVE_DESIGN" className="hover:text-white transition-colors">Laptop Đồ họa & Sáng tạo</Link></li>
              <li><Link to="/products?useCase=DATA_AI" className="hover:text-white transition-colors">Laptop Khoa học Dữ liệu & AI</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Thương Hiệu Nổi Bật</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/products?brandName=Apple" className="hover:text-white transition-colors">MacBook (Apple)</Link></li>
              <li><Link to="/products?brandName=Dell" className="hover:text-white transition-colors">Dell (XPS, Inspiron, Alienware)</Link></li>
              <li><Link to="/products?brandName=Asus" className="hover:text-white transition-colors">Asus (ROG, Zenbook, TUF)</Link></li>
              <li><Link to="/products?brandName=Lenovo" className="hover:text-white transition-colors">Lenovo (ThinkPad, Legion, LOQ)</Link></li>
              <li><Link to="/products?brandName=HP" className="hover:text-white transition-colors">HP (Omen, Pavilion, Envy)</Link></li>
            </ul>
          </div>

          {/* Policies & Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Chính Sách & Hỗ Trợ</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo hành toàn diện</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách giao hàng & kiểm tra</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật thông tin</li>
              <li className="hover:text-white cursor-pointer transition-colors">Hướng dẫn mua trả góp 0%</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 Smart E-commerce AI. Dữ liệu thử nghiệm từ MongoDB Local Catalog.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Xây dựng bằng</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>React + TypeScript + Spring Boot + MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

