import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  AlertCircle,
  Eye,
  XCircle,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  RefreshCw,
  Star,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderResponse, OrderStatus, PaymentStatus } from '../../types/order';
import type { PageResponse } from '../../types/api';

export const OrderListPage: React.FC = () => {
  const [data, setData] = useState<PageResponse<OrderResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchOrders = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrders({ page: pageNum, size: 5 });
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const handleCancelOrder = async (orderId: string, orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderCode}?`)) {
      return;
    }
    setCancellingId(orderId);
    try {
      await orderService.cancelMyOrder(orderId);
      alert(`Đã hủy đơn hàng ${orderCode} thành công.`);
      fetchOrders(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy đơn hàng.';
      alert(msg);
    } finally {
      setCancellingId(null);
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

  const renderOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3" /> Đang chuẩn bị hàng
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3" /> Đang giao hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Giao thành công
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <RotateCcw className="w-3 h-3" /> Đã hết hạn
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const renderPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            Đã thanh toán
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            Chưa thanh toán (COD)
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-7 h-7 text-rose-600" /> Đơn Hàng Của Tôi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi lịch sử mua hàng, trạng thái xử lý và giao nhận của đơn hàng.
            </p>
          </div>
          <button
            onClick={() => fetchOrders(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <div className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-slate-800 font-medium mb-1">Không thể tải dữ liệu</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchOrders(page)}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
            >
              Thử lại
            </button>
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800 mb-1">Bạn chưa có đơn hàng nào</h2>
            <p className="text-sm text-slate-500 mb-6">
              Các đơn hàng laptop bạn đặt mua sẽ hiển thị tại đây.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.content.map((order) => {
              const canCancel =
                order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';
              const isCancelling = cancellingId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all"
                >
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base font-mono">
                          {order.orderCode}
                        </span>
                        {renderOrderStatusBadge(order.orderStatus)}
                        {renderPaymentStatusBadge(order.paymentStatus)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Tổng thanh toán</p>
                      <p className="text-base sm:text-lg font-black text-rose-600">
                        {formatPrice(order.grandTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="py-4 space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.quantity}×
                          </span>
                          <Link
                            to={`/products/${item.productId}`}
                            className="font-medium text-slate-800 hover:text-rose-600 transition-colors truncate"
                          >
                            {item.productName}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="font-semibold text-slate-700">
                            {formatPrice(item.totalPrice)}
                          </span>
                          {order.orderStatus === 'DELIVERED' && (
                            <Link
                              to={`/products/${item.productId}#reviews`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-0.5 rounded-md"
                            >
                              <Star className="w-3 h-3 fill-rose-600" />
                              Đánh giá
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-500">
                      Phương thức: <strong>{order.payment?.method || 'COD'}</strong>
                    </p>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.id, order.orderCode)}
                          disabled={isCancelling}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isCancelling ? 'Đang hủy...' : 'Hủy đơn'}</span>
                        </button>
                      )}

                      <Link
                        to={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.pageNumber === 0}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold bg-white disabled:opacity-40"
                >
                  Trang trước
                </button>
                <span className="text-xs text-slate-500">
                  Trang {data.pageNumber + 1} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.isLast}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold bg-white disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
