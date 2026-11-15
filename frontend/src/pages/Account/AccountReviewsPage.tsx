import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  X,
  Laptop,
  ShoppingBag,
} from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { orderService } from '../../services/orderService';
import type { ProductReview } from '../../types/review';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ReviewableItem {
  productId: string;
  productName: string;
  thumbnailUrl?: string;
  orderCode: string;
}

export const AccountReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewableItems, setReviewableItems] = useState<ReviewableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reviewService.getMyReviews({ page: currentPage, limit: 10 });
      setReviews(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error('Failed to load my reviews', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const res = await orderService.getMyOrders({ page: 0, size: 20 });
      const delivered = res.content.filter((o) => o.orderStatus === 'DELIVERED');
      const itemsMap = new Map<string, ReviewableItem>();
      for (const order of delivered) {
        for (const item of order.items) {
          if (!itemsMap.has(item.productId)) {
            itemsMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              thumbnailUrl: item.thumbnailUrl,
              orderCode: order.orderCode,
            });
          }
        }
      }
      setReviewableItems(Array.from(itemsMap.values()));
    } catch (err) {
      console.error('Failed to load delivered orders for reviews', err);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchDeliveredOrders();
  }, [fetchReviews, fetchDeliveredOrders]);

  const handleOpenEdit = (rev: ProductReview) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditTitle(rev.title);
    setEditContent(rev.content);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    if (editTitle.trim().length < 3) {
      setFormError('Tiêu đề phải có ít nhất 3 ký tự.');
      return;
    }
    if (editContent.trim().length < 10) {
      setFormError('Nội dung phải có ít nhất 10 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await reviewService.updateMyReview(editingReview.id, {
        rating: editRating,
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setToastMessage('Cập nhật đánh giá thành công! Đánh giá sẽ được kiểm duyệt lại.');
      setIsEditModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này? Sau khi xóa bạn có thể viết lại đánh giá mới.')) return;
    try {
      await reviewService.deleteMyReview(reviewId);
      setToastMessage('Đã xóa đánh giá thành công.');
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa đánh giá.');
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
            Bị từ chối
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Title */}
        <div className="mb-6">
          <Link
            to="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Quay lại thông tin tài khoản
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-rose-600" />
                Đánh giá của tôi
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Quản lý các nhận xét và phản hồi về sản phẩm bạn đã mua ({totalElements} đánh giá)
              </p>
            </div>
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

        {/* Section: Delivered items waiting for review */}
        {reviewableItems.filter((item) => !reviews.some((r) => r.productId === item.productId)).length > 0 && (
          <div className="mb-8 p-6 bg-white rounded-3xl border border-rose-100 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Sản phẩm đã nhận hàng – Bạn có muốn chia sẻ nhận xét?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reviewableItems
                .filter((item) => !reviews.some((r) => r.productId === item.productId))
                .map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shrink-0 flex items-center justify-center relative overflow-hidden">
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
                        <Laptop className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/products/${item.productId}`}
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-rose-600 transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-[11px] text-slate-400">Đơn hàng: #{item.orderCode}</p>
                      </div>
                    </div>
                    <Link
                      to={`/products/${item.productId}#reviews`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs shrink-0 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      Đánh giá
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Bạn chưa có đánh giá nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Khi mua hàng và nhận sản phẩm thành công, bạn có thể để lại nhận xét tại trang chi tiết sản phẩm.
            </p>
            <Link
              to="/account/orders"
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Xem đơn hàng đã mua
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Header: Product link & Status */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
                  <div className="flex items-center gap-3">
                    {rev.productThumbnailUrl && (
                      <img
                        src={rev.productThumbnailUrl}
                        alt={rev.productName}
                        className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <Link
                        to={rev.productSlug ? `/products/${rev.productSlug}` : '#'}
                        className="font-bold text-slate-900 text-sm hover:text-rose-600 transition-colors flex items-center gap-1 group"
                      >
                        <span>{rev.productName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        {rev.orderCode && <span>Đơn hàng: #{rev.orderCode}</span>}
                        <span>•</span>
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderStatusBadge(rev.status)}
                    <button
                      onClick={() => handleOpenEdit(rev)}
                      title="Chỉnh sửa đánh giá"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rev.id)}
                      title="Xóa đánh giá"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rating & Content */}
                <div className="pt-4">
                  <div className="flex items-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        className={`w-4 h-4 ${
                          st <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">{rev.rating} sao</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {rev.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {rev.content}
                  </p>

                  {/* Rejection notice if REJECTED */}
                  {rev.status === 'REJECTED' && rev.rejectionReason && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <strong>Lý do từ chối:</strong> {rev.rejectionReason}
                        <div className="mt-1 text-slate-500 text-[11px]">
                          Bạn có thể bấm "Chỉnh sửa" để điều chỉnh lại nội dung phù hợp và gửi duyệt lại.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Trang trước
                </button>
                <span className="text-xs font-semibold text-slate-600 px-3">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Chỉnh sửa đánh giá
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                {editingReview.productName}
              </p>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Chất lượng sản phẩm
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEditRating(star)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= editRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-amber-600">
                      {editRating} sao
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu đề nhận xét
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={150}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={2000}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    required
                  />
                  <div className="text-right text-[11px] text-slate-400 mt-1">
                    {editContent.length}/2000 ký tự
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md shadow-rose-600/20 transition-all"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu và Gửi duyệt'}
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
