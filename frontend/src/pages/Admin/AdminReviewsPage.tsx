import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import type { ProductReview } from '../../types/review';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  // Moderation state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetReview, setTargetReview] = useState<ProductReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reviewService.getAdminReviews({
        keyword: keyword.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        rating: ratingFilter,
        page: currentPage,
        limit: 10,
      });
      setReviews(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error('Failed to load admin reviews', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, ratingFilter, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Approve review
  const handleApprove = async (review: ProductReview) => {
    try {
      setActionLoadingId(review.id);
      await reviewService.moderateReview(review.id, {
        status: 'APPROVED',
      });
      setToastMessage(`Đã duyệt đánh giá của "${review.userFullName}" thành công.`);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt đánh giá.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Reject modal
  const handleOpenReject = (review: ProductReview) => {
    setTargetReview(review);
    setRejectionReason('Nội dung không phù hợp với tiêu chuẩn đánh giá cộng đồng.');
    setRejectModalOpen(true);
  };

  // Confirm Reject
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReview) return;

    try {
      setActionLoadingId(targetReview.id);
      await reviewService.moderateReview(targetReview.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });
      setToastMessage(`Đã từ chối đánh giá của "${targetReview.userFullName}".`);
      setRejectModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối đánh giá.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Từ chối
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                Admin Panel
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-rose-600" />
              Kiểm duyệt đánh giá sản phẩm
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Duyệt hoặc từ chối các nhận xét từ khách hàng đã mua hàng ({totalElements} bản ghi)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchReviews()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Tìm theo tên sản phẩm, tên khách, email, mã đơn..."
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* Status Tabs */}
            <div className="md:col-span-6 flex flex-wrap items-center gap-2 justify-start md:justify-end">
              {[
                { label: 'Tất cả', val: 'ALL' },
                { label: 'Chờ duyệt', val: 'PENDING' },
                { label: 'Đã duyệt', val: 'APPROVED' },
                { label: 'Từ chối', val: 'REJECTED' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => {
                    setStatusFilter(tab.val);
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === tab.val
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star Filter */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc theo sao:
            </span>
            <button
              onClick={() => {
                setRatingFilter(undefined);
                setCurrentPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                ratingFilter === undefined
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất cả sao
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRatingFilter(ratingFilter === star ? undefined : star);
                  setCurrentPage(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  ratingFilter === star
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {star} <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Table / Cards */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy đánh giá nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi từ khóa hoặc bộ lọc trạng thái kiểm duyệt.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4">Khách hàng & Đơn hàng</th>
                    <th className="py-3.5 px-4">Đánh giá & Nhận xét</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Thao tác duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product */}
                      <td className="py-4 px-4 align-top w-64">
                        <div className="flex items-start gap-2.5">
                          {rev.productThumbnailUrl && (
                            <img
                              src={rev.productThumbnailUrl}
                              alt={rev.productName}
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <Link
                              to={rev.productSlug ? `/products/${rev.productSlug}` : '#'}
                              target="_blank"
                              className="font-bold text-slate-900 hover:text-rose-600 transition-colors line-clamp-2 inline-flex items-center gap-1 group"
                            >
                              <span>{rev.productName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-600 shrink-0" />
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                              ID: {rev.productId.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Order */}
                      <td className="py-4 px-4 align-top w-56">
                        <div className="font-bold text-slate-900">{rev.userFullName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {rev.userId}
                        </div>
                        {rev.orderCode && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Đơn: #{rev.orderCode}
                          </div>
                        )}
                        {rev.isVerifiedPurchase && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified Purchase
                          </div>
                        )}
                      </td>

                      {/* Rating & Content */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${
                                st <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">
                            {rev.rating}★
                          </span>
                          <span className="text-slate-300 mx-1">•</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {rev.title}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl whitespace-pre-line line-clamp-3">
                          {rev.content}
                        </p>

                        {rev.status === 'REJECTED' && rev.rejectionReason && (
                          <div className="mt-2 text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                            <strong>Lý do từ chối:</strong> {rev.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {renderStatusBadge(rev.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {rev.status !== 'APPROVED' && (
                            <button
                              disabled={actionLoadingId === rev.id}
                              onClick={() => handleApprove(rev)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                              title="Duyệt cho phép hiển thị"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Duyệt
                            </button>
                          )}

                          {rev.status !== 'REJECTED' && (
                            <button
                              disabled={actionLoadingId === rev.id}
                              onClick={() => handleOpenReject(rev)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all disabled:opacity-50"
                              title="Từ chối đánh giá"
                            >
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-500">
                  Hiển thị {reviews.length} trên tổng số {totalElements} đánh giá
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                  >
                    Trang trước
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && targetReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Từ chối đánh giá
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Đánh giá của "{targetReview.userFullName}" cho sản phẩm "{targetReview.productName}"
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lý do từ chối (Khách hàng sẽ thấy lý do này để sửa đổi)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do vi phạm hoặc cần chỉnh sửa..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoadingId === targetReview.id}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
