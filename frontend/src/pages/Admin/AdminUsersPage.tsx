import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Shield,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';
import { authService } from '../../services/authService';
import type { User } from '../../types/auth';
import type { PageResponse } from '../../types/api';

export const AdminUsersPage: React.FC = () => {
  const [data, setData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeKeyword, setActiveKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (keyword: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.getAdminUsers({
        keyword: keyword.trim() ? keyword.trim() : undefined,
        page: pageNum,
        size: 10,
      });
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(activeKeyword, page);
  }, [fetchUsers, activeKeyword, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveKeyword(searchTerm);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setActiveKeyword('');
    setPage(0);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const confirmMsg =
      nextStatus === 'LOCKED'
        ? `Bạn có chắc muốn KHÓA tài khoản ${user.email}? Người dùng này sẽ không thể đăng nhập.`
        : `Bạn có chắc muốn MỞ KHÓA tài khoản ${user.email}?`;

    if (!window.confirm(confirmMsg)) return;

    setStatusUpdatingId(user.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedUser = await authService.updateAdminUserStatus(user.id, nextStatus);
      setActionSuccess(
        `Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${updatedUser.email} thành công!`
      );
      // Cập nhật lại danh sách trực tiếp trên client để mượt mà
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((u) => (u.id === user.id ? updatedUser : u)),
            }
          : null
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'Không thể cập nhật trạng thái người dùng.'
          : err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái người dùng.';
      setActionError(msg);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa có';
    try {
      return new Date(isoString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" /> Quản trị viên
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-8 h-8 text-rose-600" /> Quản Lý Người Dùng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Xem danh sách tài khoản, tìm kiếm và quản lý trạng thái kích hoạt / khóa tài khoản người dùng.
            </p>
          </div>

          <button
            onClick={() => fetchUsers(activeKeyword, page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Action Alerts */}
        {actionSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
            >
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
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo họ tên hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
              >
                Tìm kiếm
              </button>
              {activeKeyword && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </form>
          {activeKeyword && (
            <p className="text-xs text-slate-500 mt-2">
              Đang lọc theo từ khóa: <strong className="text-slate-800">"{activeKeyword}"</strong>
            </p>
          )}
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Đang tải danh sách tài khoản...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-slate-800 font-medium mb-1">Không thể tải dữ liệu</p>
              <p className="text-slate-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => fetchUsers(activeKeyword, page)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
              >
                Thử lại
              </button>
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">Không tìm thấy người dùng nào</p>
              <p className="text-slate-400 text-sm mt-1">
                {activeKeyword ? 'Hãy thử tìm với từ khóa khác.' : 'Hệ thống chưa có tài khoản nào.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Người dùng</th>
                    <th className="py-3.5 px-4">Số điện thoại</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Ngày tạo / Đăng nhập cuối</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.content.map((u) => {
                    const isAdmin = u.role === 'ROLE_ADMIN';
                    const isActive = u.status === 'ACTIVE';
                    const isUpdating = statusUpdatingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* User Info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200 shrink-0">
                              {u.fullName?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {u.fullName || 'Chưa đặt tên'}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 text-slate-600">
                          {u.phoneNumber ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3 text-slate-400" /> {u.phoneNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Chưa cập nhật</span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Shield className="w-3 h-3" /> Quản trị viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Khách hàng
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Đã khóa
                            </span>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-4 text-xs text-slate-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Tạo: {formatDate(u.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Login: {formatDate(u.lastLoginAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isUpdating}
                            title={isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs ${
                              isActive
                                ? 'bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                            } disabled:opacity-50`}
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isActive ? (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Mở khóa
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {data && data.totalPages > 1 && (
            <div className="px-4 py-3 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Hiển thị trang <strong className="text-slate-800">{data.pageNumber + 1}</strong> /{' '}
                <strong className="text-slate-800">{data.totalPages}</strong> (Tổng cộng{' '}
                <strong className="text-slate-800">{data.totalElements}</strong> người dùng)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.pageNumber === 0 || loading}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                {Array.from({ length: data.totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPage(idx)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      data.pageNumber === idx
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.isLast || loading}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
