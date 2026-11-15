import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Laptop,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (value?: number) => {
    if (value == null) return '0 ₫';
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  const handleQuantityChange = async (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        await removeItem(productId);
      }
      return;
    }
    if (newQty > 10) {
      alert('Số lượng tối đa cho mỗi sản phẩm là 10.');
      return;
    }
    try {
      await updateQuantity(productId, newQty);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật số lượng.';
      alert(msg);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?')) {
      await clearCart();
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-slate-50 min-h-[65vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Giỏ hàng của bạn đang trống</h1>
          <p className="text-sm text-slate-500 mb-6">
            Hãy khám phá các mẫu laptop chính hãng với giá ưu đãi để thêm vào giỏ hàng ngay hôm nay.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20 text-sm"
          >
            <Laptop className="w-4 h-4" /> Khám Phá Laptop Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShoppingCart className="w-7 h-7 text-rose-600" /> Giỏ Hàng Của Bạn
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bạn có <strong>{cart.totalQuantity}</strong> sản phẩm trong giỏ hàng.
            </p>
          </div>

          <button
            onClick={handleClearCart}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Xóa tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-sm"
              >
                {/* Product thumbnail + details */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 p-2 shrink-0 border border-slate-100 flex items-center justify-center overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Laptop className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="font-bold text-slate-900 hover:text-rose-600 transition-colors text-sm sm:text-base line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm font-extrabold text-rose-600">
                        {formatPrice(item.unitPrice)}
                      </span>
                      {item.listPrice && item.listPrice > item.unitPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(item.listPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity, -1)}
                      disabled={loading}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity, 1)}
                      disabled={loading || item.quantity >= 10}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-slate-400">Thành tiền</p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    disabled={loading}
                    title="Xóa sản phẩm này"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Commitments badge */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Giao hàng toàn quốc</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bảo hành chính hãng</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Hỗ trợ đổi trả trong 30 ngày</span>
              </div>
            </div>
          </div>

          {/* Cart Summary (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Tóm Tắt Đơn Hàng
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính ({cart.totalQuantity} món)</span>
                  <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-emerald-600 font-semibold">Miễn phí</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phương thức</span>
                  <span className="font-medium text-slate-800">Thanh toán khi nhận (COD)</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                  <span className="text-xl font-black text-rose-600">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => navigate('/checkout')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all text-sm group"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  to="/products"
                  className="w-full block text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ← Tiếp tục chọn mua sản phẩm khác
                </Link>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                * Tồn kho thực tế sẽ được hệ thống đặt giữ 15 phút ngay khi bạn xác nhận đặt hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
