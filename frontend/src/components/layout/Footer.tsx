import React from 'react';
import { Laptop, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
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
              Nền tảng thương mại điện tử chuyên biệt quản lý và tra cứu danh mục máy tính xách tay, hướng tới tích hợp trí tuệ nhân tạo hỗ trợ người dùng.
            </p>
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

          {/* System & Architecture Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Thông Tin Hệ Thống</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white transition-colors">Quy chuẩn dữ liệu Catalog v1.2.1</li>
              <li className="hover:text-white transition-colors">Quy trình kiểm thử tích hợp API</li>
              <li className="hover:text-white transition-colors">Hướng dẫn tra cứu & lọc cấu hình</li>
              <li className="hover:text-white transition-colors">Mô hình kiến trúc Spring Boot & React</li>
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
