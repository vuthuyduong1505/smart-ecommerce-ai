import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Laptop,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderResponse } from '../../types/order';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const orderPlacedNotice = (location.state as { orderPlaced?: boolean; orderCode?: string })?.orderPlaced;

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrderById(id);
      setOrder(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin đơn hàng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.orderCode}?`)) {
      return;
    }
    setCancelling(true);
    try {
      const updated = await orderService.cancelMyOrder(order.id);
      setOrder(updated);
      alert('Đã hủy đơn hàng thành công.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy đơn hàng.';
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (value?: number) => {
    if (value == null) return '0 ₫';
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
          >
            Về danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng
          </Link>
        </div>

        {/* Order placed success banner */}
        {orderPlacedNotice && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-extrabold text-base">Đặt Hàng Thành Công!</h2>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                Cảm ơn bạn đã mua sắm tại SMARTLAP. Đơn hàng của bạn đã được ghi nhận với mã{' '}
                <strong className="font-mono">{order.orderCode}</strong> và đang được nhân viên chuẩn bị đóng gói.
              </p>
            </div>
          </div>
        )}

        {/* Order Overview Header Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  {order.orderCode}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {order.orderStatus}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Thời gian đặt: {formatDate(order.createdAt)}
              </p>
            </div>

            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors self-start sm:self-auto disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelling ? 'Đang hủy đơn...' : 'Hủy đơn hàng'}</span>
              </button>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {/* Shipping Address */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" /> Địa chỉ giao hàng
              </p>
              <p className="text-sm font-bold text-slate-900">{order.shippingAddress?.receiverName}</p>
              <p className="text-xs text-slate-600">{order.shippingAddress?.phoneNumber}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{order.shippingAddress?.fullAddress}</p>
            </div>

            {/* Payment Details */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-600" /> Thanh toán
              </p>
              <p className="text-sm font-bold text-slate-900">
                {order.payment?.method === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.payment?.method}
              </p>
              <p className="text-xs text-slate-600">
                Trạng thái: <strong>{order.paymentStatus === 'PAID' ? 'Đã thu tiền' : 'Chưa thu tiền'}</strong>
              </p>
              {order.payment?.paidAt && (
                <p className="text-xs text-slate-400">Thanh toán lúc: {formatDate(order.payment.paidAt)}</p>
              )}
            </div>

            {/* Reservation / Note */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" /> Giữ hàng & Ghi chú
              </p>
              <p className="text-xs text-slate-700">
                Giữ hàng: <strong>{order.reservationStatus}</strong>
              </p>
              {order.notes && (
                <p className="text-xs text-slate-600 italic mt-1 flex items-start gap-1">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>"{order.notes}"</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Table Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-600" /> Danh Sách Sản Phẩm Đặt Mua
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-left">Sản phẩm</th>
                  <th className="py-3.5 px-4 text-center w-28">Số lượng</th>
                  <th className="py-3.5 px-4 text-right w-36">Đơn giá</th>
                  <th className="py-3.5 px-4 text-right w-44">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 flex items-center justify-center relative overflow-hidden">
                          {item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.productName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <Laptop className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/products/${item.productSlug || item.productId}`}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-rose-600 transition-colors line-clamp-2"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700 align-middle">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 font-medium align-middle whitespace-nowrap">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-900 font-extrabold align-middle whitespace-nowrap">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-100">
                <tr>
                  <td colSpan={3} className="pt-4 pb-1.5 px-4 text-right text-xs text-slate-500 font-medium">Tạm tính:</td>
                  <td className="pt-4 pb-1.5 px-4 text-right font-bold text-slate-800 text-sm whitespace-nowrap">{formatPrice(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1.5 px-4 text-right text-xs text-slate-500 font-medium">Phí vận chuyển:</td>
                  <td className="py-1.5 px-4 text-right font-bold text-emerald-600 text-sm whitespace-nowrap">Miễn phí</td>
                </tr>
                {order.discountAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="py-1.5 px-4 text-right text-xs text-slate-500 font-medium">Giảm giá:</td>
                    <td className="py-1.5 px-4 text-right font-bold text-rose-600 text-sm whitespace-nowrap">-{formatPrice(order.discountAmount)}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="pt-3 pb-2 px-4 text-right font-bold text-slate-900 text-sm sm:text-base">Tổng thanh toán:</td>
                  <td className="pt-3 pb-2 px-4 text-right font-black text-rose-600 text-lg sm:text-xl whitespace-nowrap">{formatPrice(order.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
