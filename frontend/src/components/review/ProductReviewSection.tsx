import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reviewService } from '../../services/reviewService';
import type {
  ProductReview,
  ReviewSummary,
  ReviewEligibility,
} from '../../types/review';

interface Props {
  productId: string;
  productName: string;
}

export const ProductReviewSection: React.FC<Props> = ({ productId, productName }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    rating1Count: 0,
    rating2Count: 0,
    rating3Count: 0,
    rating4Count: 0,
    rating5Count: 0,
  });
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [modalRating, setModalRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load reviews list
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reviewService.getProductReviews(productId, {
        rating: selectedRating,
        sort: sortBy,
        page: currentPage,
        limit: 5,
      });
      setReviews(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedRating, sortBy, currentPage]);

  // Load review summary
  const loadSummary = useCallback(async () => {
    try {
      const sum = await reviewService.getProductReviewSummary(productId);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  }, [productId]);

  // Load user eligibility
  const loadEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibility(null);
      return;
    }
    try {
      const elig = await reviewService.checkEligibility(productId);
      setEligibility(elig);
    } catch (err) {
      console.error('Failed to check review eligibility', err);
    }
  }, [isAuthenticated, productId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  useEffect(() => {
    if (window.location.hash === '#reviews') {
      setTimeout(() => {
        const el = document.getElementById('reviews');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, []);

  // Handle open write review modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingReviewId(null);
    setModalRating(5);
    setModalTitle('');
    setModalContent('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle open edit review modal
  const handleOpenEditModal = (rev: ProductReview) => {
    setIsEditing(true);
    setEditingReviewId(rev.id);
    setModalRating(rev.rating);
    setModalTitle(rev.title);
    setModalContent(rev.content);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit modal (Create or Update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalTitle.trim().length < 3) {
      setFormError('Tiêu đề đánh giá phải có ít nhất 3 ký tự.');
      return;
    }
    if (modalContent.trim().length < 10) {
      setFormError('Nội dung đánh giá phải có ít nhất 10 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (isEditing && editingReviewId) {
        await reviewService.updateMyReview(editingReviewId, {
          rating: modalRating,
          title: modalTitle.trim(),
          content: modalContent.trim(),
        });
        setActionSuccess('Cập nhật đánh giá thành công! Đánh giá sẽ được kiểm duyệt lại.');
      } else {
        await reviewService.createReview(productId, {
          rating: modalRating,
          title: modalTitle.trim(),
          content: modalContent.trim(),
        });
        setActionSuccess('Đánh giá của bạn đã được gửi thành công và đang chờ kiểm duyệt.');
      }

      setIsModalOpen(false);
      loadSummary();
      loadReviews();
      loadEligibility();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle soft delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;
    try {
      await reviewService.deleteMyReview(reviewId);
      setActionSuccess('Đã xóa đánh giá thành công.');
      loadSummary();
      loadReviews();
      loadEligibility();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa đánh giá.');
    }
  };

  const getPercent = (count: number) => {
    if (summary.totalReviews === 0) return 0;
    return Math.round((count / summary.totalReviews) * 100);
  };

  return (
    <div id="reviews" className="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 mt-10 shadow-xs scroll-mt-24">
      {/* Title */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-rose-600" />
            Đánh giá sản phẩm
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nhận xét thực tế từ khách hàng đã mua và trải nghiệm <strong>{productName}</strong>
          </p>
        </div>

        {/* Action Button: Viết đánh giá */}
        <div>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Đăng nhập để đánh giá
            </Link>
          ) : eligibility?.canReview ? (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
            >
              <Star className="w-4 h-4 fill-white" />
              Viết đánh giá của bạn
            </button>
          ) : eligibility?.existingReview ? (
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                Đánh giá của bạn: {eligibility.existingReview.status}
              </span>
              <button
                onClick={() => handleOpenEditModal(eligibility.existingReview!)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 underline"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Chỉnh sửa
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Dành riêng cho khách hàng đã mua hàng
            </div>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Score & Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 bg-slate-50/70 rounded-2xl border border-slate-100 mb-8 items-center">
        {/* Left: Big Score */}
        <div className="md:col-span-4 text-center md:border-r border-slate-200/80 pr-0 md:pr-6">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '0.0'}
            <span className="text-xl sm:text-2xl text-slate-400 font-normal">/5</span>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(summary.averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            Dựa trên <strong>{summary.totalReviews}</strong> đánh giá xác thực
          </div>
        </div>

        {/* Right: Progress bars */}
        <div className="md:col-span-8 space-y-2">
          {[
            { star: 5, count: summary.rating5Count },
            { star: 4, count: summary.rating4Count },
            { star: 3, count: summary.rating3Count },
            { star: 2, count: summary.rating2Count },
            { star: 1, count: summary.rating1Count },
          ].map(({ star, count }) => {
            const pct = getPercent(count);
            const isSelected = selectedRating === star;
            return (
              <div
                key={star}
                onClick={() => {
                  setSelectedRating(isSelected ? undefined : star);
                  setCurrentPage(0);
                }}
                className={`flex items-center gap-3 text-xs cursor-pointer px-2 py-1 rounded-lg transition-colors ${
                  isSelected ? 'bg-rose-50 border border-rose-200' : 'hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-1 w-12 font-semibold text-slate-700 shrink-0">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-14 text-right text-slate-500 shrink-0">
                  {count} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          <button
            onClick={() => {
              setSelectedRating(undefined);
              setCurrentPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedRating === undefined
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả ({summary.totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedRating(selectedRating === st ? undefined : st);
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                selectedRating === st
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st} <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(0);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="rating_desc">Sao cao nhất</option>
            <option value="rating_asc">Sao thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Đang tải đánh giá sản phẩm...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có đánh giá nào phù hợp.</p>
          <p className="text-xs text-slate-400 mt-1">
            {selectedRating
              ? `Không có đánh giá ${selectedRating} sao nào.`
              : 'Hãy là người đầu tiên trải nghiệm và chia sẻ nhận xét về sản phẩm này!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const isOwner = currentUser?.id === rev.userId;
            return (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-2xs transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm uppercase">
                      {rev.userFullName ? rev.userFullName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {rev.userFullName || 'Khách hàng'}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Đã mua hàng
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(rev)}
                        title="Chỉnh sửa đánh giá"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        title="Xóa đánh giá"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating stars & Title */}
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        className={`w-4 h-4 ${
                          st <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {rev.title}
                  </h4>
                </div>

                {/* Content */}
                <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>

                {/* Helpful badge */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400">
                  <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Hữu ích</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang trước
              </button>
              <span className="text-xs font-medium text-slate-600 px-2">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Modal Form (Write / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {isEditing ? 'Chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {productName}
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chất lượng sản phẩm
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setModalRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (hoverRating || modalRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-600">
                    {modalRating === 5 && 'Tuyệt vời'}
                    {modalRating === 4 && 'Rất tốt'}
                    {modalRating === 3 && 'Bình thường'}
                    {modalRating === 2 && 'Không hài lòng'}
                    {modalRating === 1 && 'Rất tệ'}
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề nhận xét
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="VD: Máy chạy mượt mà, màn hình rất đẹp"
                  maxLength={150}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={4}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận về hiệu năng, thiết kế, thời lượng pin..."
                  maxLength={2000}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {modalContent.length}/2000 ký tự (tối thiểu 10)
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md shadow-rose-600/20 transition-all"
                >
                  {submitting ? 'Đang gửi...' : isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
