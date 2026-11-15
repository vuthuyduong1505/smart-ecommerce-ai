import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Laptop,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Settings,
  Package,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleClearSearch = () => {
    setKeyword('');
    navigate('/products');
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng Giỏ hàng theo đúng thiết kế hệ thống!');
      navigate('/login');
    } else {
      navigate('/cart');
    }
  };

  const getDisplayName = () => {
    if (!currentUser) return 'Tài khoản';
    return currentUser.fullName || currentUser.email.split('@')[0];
  };

  const getInitials = () => {
    if (!currentUser) return 'U';
    if (currentUser.fullName) {
      const parts = currentUser.fullName.trim().split(/\s+/);
      return parts[parts.length - 1].charAt(0).toUpperCase();
    }
    return currentUser.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 block leading-tight">
                SMART<span className="text-rose-600">LAP</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block -mt-0.5">
                E-commerce AI
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl hidden md:flex items-center relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm laptop theo tên, cấu hình (i7, RTX 4060, M3, 16GB)..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 rounded-xl text-sm border border-transparent focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all outline-hidden"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {keyword && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
                >
                  Xóa
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* User actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/products"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <span>Xem tất cả Laptop</span>
            </Link>

            {/* User Account / Auth Section */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {getInitials()}
                  </div>
                  <span className="hidden sm:inline font-semibold text-slate-800 max-w-[120px] truncate">
                    {getDisplayName()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {currentUser?.fullName || 'Người dùng'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                      {isAdmin && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold">
                          <Shield className="w-3 h-3" /> Quản trị viên
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Thông tin tài khoản</span>
                      </Link>

                      <Link
                        to="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      <Link
                        to="/account/reviews"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>Đánh giá của tôi</span>
                      </Link>

                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-slate-100" />
                          <Link
                            to="/admin/users"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-rose-500" />
                            <span>Quản lý người dùng</span>
                          </Link>
                          <Link
                            to="/admin/orders"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                          >
                            <Package className="w-4 h-4 text-rose-500" />
                            <span>Quản lý đơn hàng</span>
                          </Link>
                          <Link
                            to="/admin/reviews"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-rose-500" />
                            <span>Quản lý đánh giá</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Cart Icon with Live Badge */}
            <button
              onClick={handleCartClick}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors group"
              title="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-in zoom-in-75">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 md:hidden hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm laptop..."
              className="w-full pl-10 pr-20 py-2 bg-slate-100 focus:bg-white text-slate-900 rounded-xl text-sm border border-transparent focus:border-rose-500 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {isAuthenticated ? (
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{currentUser?.fullName || 'Người dùng'}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Tài khoản
                </Link>
                <Link
                  to="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Đơn mua
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700"
                >
                  Giỏ hàng ({cartCount})
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-3 py-2 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700"
                  >
                    Quản lý Đơn
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="col-span-2 text-center px-3 py-2 rounded-xl bg-rose-100 text-xs font-semibold text-rose-700"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-3 border-b border-slate-100 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-slate-100 text-slate-800 rounded-xl text-sm font-semibold"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Trang chủ
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Tất cả Laptop
          </Link>
          <Link
            to="/products?useCase=GAMING"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Laptop Gaming & Đồ họa
          </Link>
          <Link
            to="/products?useCase=OFFICE"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Laptop Văn phòng & Học tập
          </Link>
          <Link
            to="/products?useCase=THIN_LIGHT"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Laptop Mỏng nhẹ cao cấp
          </Link>
        </div>
      )}
    </header>
  );
};
