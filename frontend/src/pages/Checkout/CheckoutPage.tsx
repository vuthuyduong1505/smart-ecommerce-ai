import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  MapPin,
  User,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, refreshCart } = useCart();

  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Điền trước thông tin từ tài khoản nếu có
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName && !receiverName) setReceiverName(currentUser.fullName);
      if (currentUser.phoneNumber && !phoneNumber) setPhoneNumber(currentUser.phoneNumber);
      if (currentUser.addresses && currentUser.addresses.length > 0 && !fullAddress) {
        const def = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
        const parts = [def.street, def.ward, def.district, def.province].filter(Boolean);
        setFullAddress(parts.join(', '));
      }
    }
  }, [currentUser]);

  const formatPrice = (value?: number) => {
    if (value == null) return '0 ₫';
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiverName.trim()) {
      setError('Vui lòng nhập họ và tên người nhận.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại người nhận.');
      return;
    }
    if (!fullAddress.trim()) {
      setError('Vui lòng nhập địa chỉ nhận hàng chi tiết.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.checkout({
        shippingAddress: {
          receiverName: receiverName.trim(),
          phoneNumber: phoneNumber.trim(),
          fullAddress: fullAddress.trim(),
        },
        notes: notes.trim() || undefined,
        paymentMethod: 'COD',
      });

      // Làm mới giỏ hàng (vì backend đã xóa giỏ)
      await refreshCart();

      // Chuyển tới trang chi tiết đơn hàng vừa tạo
      navigate(`/account/orders/${order.id}`, {
        state: { orderPlaced: true, orderCode: order.orderCode },
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'Không thể hoàn tất đặt hàng. Vui lòng thử lại.'
          : err instanceof Error
          ? err.message
          : 'Không thể hoàn tất đặt hàng.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Giỏ hàng trống</h2>
          <p className="text-sm text-slate-500 mb-6">Bạn chưa có sản phẩm nào trong giỏ để đặt hàng.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
          >
            Quay lại chọn sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back button */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <Truck className="w-7 h-7 text-rose-600" /> Xác Nhận Đặt Hàng & Thanh Toán
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Đặt hàng chưa thành công</strong>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form & Payment Selection (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Recipient Information */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" /> 1. Thông Tin Nhận Hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="VD: 0987654321"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Địa chỉ nhận hàng chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Ghi chú đơn hàng (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-600" /> 2. Phương Thức Thanh Toán
              </h2>

              <div className="border-2 border-rose-600 bg-rose-50/40 rounded-xl p-4 flex items-start gap-3.5">
                <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-rose-600 flex items-center justify-center shrink-0 bg-white">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">
                    Thanh toán khi nhận hàng (COD - Cash on Delivery)
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Bạn chỉ phải thanh toán tiền mặt cho nhân viên giao hàng sau khi nhận và kiểm tra laptop.
                  </p>
                </div>
                <Truck className="w-6 h-6 text-rose-600 shrink-0" />
              </div>

              <p className="text-xs text-slate-400 mt-3 italic">
                * Các phương thức thanh toán trực tuyến (VNPAY, MoMo) đang trong lộ trình phát triển.
              </p>
            </div>

            {/* 3. Items list preview */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-rose-600" /> 3. Danh Sách Sản Phẩm ({cart.totalQuantity})
              </h2>

              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 p-1 shrink-0 flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Laptop className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatPrice(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm shrink-0">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Submit (1 col) */}
          <div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs sticky top-24 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Tổng Kết Thanh Toán
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền hàng ({cart.totalQuantity} món)</span>
                  <span className="font-semibold text-slate-900">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí giao hàng</span>
                  <span className="text-emerald-600 font-semibold">Miễn phí</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold text-slate-900">0 ₫</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-rose-600">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Đặt Hàng COD</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Chính sách giữ hàng:</p>
                <p>
                  • Hệ thống tự động đặt giữ tồn kho chính xác trong 15 phút.
                </p>
                <p>
                  • Hỗ trợ xem hàng trước khi nhận và thanh toán.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
