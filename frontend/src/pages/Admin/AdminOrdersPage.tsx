import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { OrderResponse } from '../../types/order';
import type { PageResponse } from '../../types/api';

export const AdminOrdersPage: React.FC = () => {
  const [data, setData] = useState<PageResponse<OrderResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeKeyword, setActiveKeyword] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getAdminOrders({
        keyword: activeKeyword.trim() ? activeKeyword.trim() : undefined,
        status: selectedStatus || undefined,
        page,
        size: 10,
      });
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeKeyword, selectedStatus, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveKeyword(searchTerm);
  };

  const handleUpdateStatus = async (orderId: string, orderCode: string, nextStatus: string) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng ${orderCode} sang ${nextStatus}?`)) {
      return;
    }
    setUpdatingId(orderId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await orderService.updateAdminOrderStatus(orderId, { status: nextStatus });
      setActionSuccess(`Đã chuyển trạng thái đơn ${updated.orderCode} sang ${updated.orderStatus} thành công.`);
      // Cập nhật lại trong data
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((o) => (o.id === orderId ? updated : o)),
            }
          : null
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'Không thể cập nhật trạng thái đơn hàng.'
          : err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái đơn hàng.';
      setActionError(msg);
    } finally {
      setUpdatingId(null);
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

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" /> Quản trị viên
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-8 h-8 text-rose-600" /> Quản Lý Đơn Hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Xem và kiểm soát trạng thái xử lý các đơn hàng laptop toàn hệ thống.
            </p>
          </div>

          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Alerts */}
        {actionSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-700 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 mb-6 flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã đơn hàng hoặc tên khách hàng..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition-colors shrink-0"
            >
              Tìm
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="PROCESSING">Đang chuẩn bị (PROCESSING)</option>
              <option value="SHIPPED">Đang giao (SHIPPED)</option>
              <option value="DELIVERED">Đã giao (DELIVERED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              <option value="EXPIRED">Hết hạn (EXPIRED)</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-slate-800 font-medium mb-1">Không thể tải dữ liệu</p>
              <p className="text-slate-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => fetchOrders()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
              >
                Thử lại
              </button>
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Mã đơn & Ngày đặt</th>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">Tổng tiền</th>
                    <th className="py-3.5 px-4">Trạng thái đơn</th>
                    <th className="py-3.5 px-4">Thanh toán & Kho</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Chuyển trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((order) => {
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Order Code */}
                        <td className="py-4 px-4 sm:px-6">
                          <p className="font-extrabold text-slate-900 font-mono text-sm">
                            {order.orderCode}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                          <span className="text-[11px] text-slate-500">{order.items?.length || 0} sản phẩm</span>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-800">{order.shippingAddress?.receiverName}</p>
                          <p className="text-xs text-slate-500">{order.shippingAddress?.phoneNumber}</p>
                          <p className="text-xs text-slate-400 max-w-[200px] truncate">
                            {order.shippingAddress?.fullAddress}
                          </p>
                        </td>

                        {/* Total */}
                        <td className="py-4 px-4">
                          <p className="font-extrabold text-rose-600">{formatPrice(order.grandTotal)}</p>
                          <span className="text-[11px] text-slate-400">{order.payment?.method || 'COD'}</span>
                        </td>

                        {/* Order Status */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {order.orderStatus}
                          </span>
                        </td>

                        {/* Payment & Reservation */}
                        <td className="py-4 px-4 text-xs space-y-1">
                          <p>
                            TT: <strong className={order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-slate-600'}>{order.paymentStatus}</strong>
                          </p>
                          <p className="text-slate-500">
                            Kho: <strong>{order.reservationStatus}</strong>
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right space-x-1.5">
                          {order.orderStatus === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderCode, 'CONFIRMED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              Xác nhận
                            </button>
                          )}

                          {order.orderStatus === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderCode, 'PROCESSING')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                              Chuẩn bị hàng
                            </button>
                          )}

                          {order.orderStatus === 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderCode, 'SHIPPED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                            >
                              Giao hàng
                            </button>
                          )}

                          {order.orderStatus === 'SHIPPED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderCode, 'DELIVERED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            >
                              Hoàn tất (Đã giao)
                            </button>
                          )}

                          {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.orderCode, 'CANCELLED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="px-4 py-3 sm:px-6 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Hiển thị trang <strong>{data.pageNumber + 1}</strong> / <strong>{data.totalPages}</strong> ({data.totalElements} đơn)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.pageNumber === 0 || loading}
                  className="px-3 py-1.5 rounded-lg border bg-white text-xs font-medium text-slate-600 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.isLast || loading}
                  className="px-3 py-1.5 rounded-lg border bg-white text-xs font-medium text-slate-600 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
