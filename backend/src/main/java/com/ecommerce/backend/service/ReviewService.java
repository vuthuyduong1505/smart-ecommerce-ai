package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.review.*;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.ReviewRepository;
import com.ecommerce.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         OrderRepository orderRepository,
                         UserRepository userRepository,
                         MongoTemplate mongoTemplate) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Lấy danh sách đánh giá đã duyệt (APPROVED) của sản phẩm dành cho khách xem công khai.
     */
    public PageResponse<ReviewResponse> getApprovedProductReviews(String productId, Integer rating, String sort, Pageable pageable) {
        Sort sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("oldest".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.ASC, "createdAt");
        } else if ("rating_desc".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else if ("rating_asc".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sorting);

        Page<ProductReview> page;
        if (rating != null && rating >= 1 && rating <= 5) {
            page = reviewRepository.findByProductIdAndStatusAndRating(productId, ReviewStatus.APPROVED, rating, effectivePageable);
        } else {
            page = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED, effectivePageable);
        }

        List<ReviewResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    /**
     * Lấy thống kê đánh giá (Rating Summary) tổng hợp từ các đánh giá APPROVED.
     */
    public ReviewSummaryResponse getProductReviewSummary(String productId) {
        List<ProductReview> approvedReviews = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED);
        return calculateSummary(approvedReviews);
    }

    /**
     * Kiểm tra điều kiện viết đánh giá (Verified Purchase check).
     */
    public ReviewEligibilityResponse checkReviewEligibility(String userId, String productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId);
        }

        // Kiểm tra xem đã có đánh giá active (PENDING, APPROVED, REJECTED) chưa
        Optional<ProductReview> existingReviewOpt = reviewRepository.findByUserIdAndProductIdAndStatusIn(
                userId, productId, List.of(ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED)
        );

        if (existingReviewOpt.isPresent()) {
            ProductReview existing = existingReviewOpt.get();
            ReviewResponse resp = mapToResponse(existing);
            String msg = "Bạn đã gửi đánh giá cho sản phẩm này (" + existing.getStatus() + ").";
            return new ReviewEligibilityResponse(false, true, resp, existing.getOrderId(), msg);
        }

        // Kiểm tra đơn hàng DELIVERED và PAID có chứa sản phẩm và chưa bị hoàn trả hết
        Optional<Order> eligibleOrderOpt = findEligibleOrder(userId, productId);

        if (eligibleOrderOpt.isPresent()) {
            Order order = eligibleOrderOpt.get();
            return new ReviewEligibilityResponse(
                    true,
                    true,
                    null,
                    order.getId(),
                    "Bạn đủ điều kiện đánh giá sản phẩm này với tư cách Người mua đã xác thực."
            );
        } else {
            return new ReviewEligibilityResponse(
                    false,
                    false,
                    null,
                    null,
                    "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công."
            );
        }
    }

    /**
     * Khách hàng tạo đánh giá mới (bắt buộc Verified Purchase).
     */
    public ReviewResponse createReview(String userId, String productId, CreateReviewRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));

        // Kiểm tra trùng lặp đánh giá active
        Optional<ProductReview> existingReviewOpt = reviewRepository.findByUserIdAndProductIdAndStatusIn(
                userId, productId, List.of(ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED)
        );
        if (existingReviewOpt.isPresent()) {
            throw new BadRequestException("Bạn đã có một đánh giá đang hoạt động cho sản phẩm này ("
                    + existingReviewOpt.get().getStatus() + ").");
        }

        // Kiểm tra xác thực mua hàng
        Order eligibleOrder = findEligibleOrder(userId, productId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa mua hoặc chưa nhận thành công sản phẩm này để có thể đánh giá."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + userId));

        ProductReview review = new ProductReview();
        review.setUserId(userId);
        review.setUserFullName(user.getFullName() != null ? user.getFullName() : "Khách hàng");
        review.setUserEmail(user.getEmail());

        review.setProductId(productId);
        review.setProductName(product.getName());
        review.setProductSlug(product.getSlug());
        String thumb = (product.getImages() != null && !product.getImages().isEmpty())
                ? product.getImages().get(0)
                : product.getThumbnailUrl();
        review.setProductThumbnailUrl(thumb);

        review.setOrderId(eligibleOrder.getId());
        review.setOrderCode(eligibleOrder.getOrderCode());

        review.setRating(req.getRating());
        review.setTitle(req.getTitle().trim());
        review.setContent(req.getContent().trim());

        review.setIsVerifiedPurchase(true);
        review.setStatus(ReviewStatus.PENDING);
        review.setCreatedAt(Instant.now());
        review.setUpdatedAt(Instant.now());

        ProductReview saved = reviewRepository.save(review);
        log.info("User {} created review {} for product {} (status: PENDING)", userId, saved.getId(), productId);

        return mapToResponse(saved);
    }

    /**
     * Khách hàng xem danh sách đánh giá của chính mình.
     */
    public PageResponse<ReviewResponse> getMyReviews(String userId, Pageable pageable) {
        Page<ProductReview> page = reviewRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(
                userId, ReviewStatus.DELETED, pageable
        );

        List<ReviewResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    /**
     * Khách hàng chỉnh sửa đánh giá của chính mình.
     * Quy tắc: Nếu đánh giá trước đó đã APPROVED, khi chỉnh sửa sẽ chuyển về PENDING để kiểm duyệt lại,
     * và lập tức tính lại ratingSummary của sản phẩm.
     */
    public ReviewResponse updateMyReview(String userId, String reviewId, UpdateReviewRequest req) {
        ProductReview review = reviewRepository.findByIdAndUserIdAndStatusNot(reviewId, userId, ReviewStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại hoặc bạn không có quyền thao tác"));

        ReviewStatus prevStatus = review.getStatus();

        review.setRating(req.getRating());
        review.setTitle(req.getTitle().trim());
        review.setContent(req.getContent().trim());
        review.setUpdatedAt(Instant.now());

        // Nếu sửa đánh giá APPROVED hoặc REJECTED -> Đưa về PENDING để duyệt lại
        if (prevStatus == ReviewStatus.APPROVED || prevStatus == ReviewStatus.REJECTED) {
            review.setStatus(ReviewStatus.PENDING);
            review.setModeratedBy(null);
            review.setModeratedAt(null);
            review.setRejectionReason(null);
        }

        ProductReview saved = reviewRepository.save(review);
        log.info("User {} updated review {} (status changed from {} to {})", userId, reviewId, prevStatus, saved.getStatus());

        // Nếu review từng APPROVED, giờ chuyển sang PENDING thì phải recompute rating summary
        if (prevStatus == ReviewStatus.APPROVED) {
            recomputeRatingSummary(review.getProductId());
        }

        return mapToResponse(saved);
    }

    /**
     * Khách hàng xóa mềm đánh giá của mình (DELETED).
     * Đánh giá bị xóa mềm sẽ được giải phóng khỏi unique index và lập tức tính lại ratingSummary nếu trước đó APPROVED.
     */
    public void deleteMyReview(String userId, String reviewId) {
        ProductReview review = reviewRepository.findByIdAndUserIdAndStatusNot(reviewId, userId, ReviewStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại hoặc bạn không có quyền thao tác"));

        ReviewStatus prevStatus = review.getStatus();
        review.setStatus(ReviewStatus.DELETED);
        review.setUpdatedAt(Instant.now());
        reviewRepository.save(review);
        log.info("User {} soft-deleted review {}", userId, reviewId);

        if (prevStatus == ReviewStatus.APPROVED) {
            recomputeRatingSummary(review.getProductId());
        }
    }

    /**
     * Admin xem danh sách đánh giá có lọc và phân trang.
     */
    public PageResponse<ReviewResponse> getAdminReviews(String keyword, String statusStr, Integer rating, Pageable pageable) {
        Query query = new Query();

        // Mặc định không hiển thị DELETED trừ khi tìm kiếm cụ thể
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr.trim())) {
            try {
                ReviewStatus st = ReviewStatus.valueOf(statusStr.trim().toUpperCase());
                query.addCriteria(Criteria.where("status").is(st));
            } catch (IllegalArgumentException ignored) {
                query.addCriteria(Criteria.where("status").ne(ReviewStatus.DELETED));
            }
        } else {
            query.addCriteria(Criteria.where("status").ne(ReviewStatus.DELETED));
        }

        if (rating != null && rating >= 1 && rating <= 5) {
            query.addCriteria(Criteria.where("rating").is(rating));
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String cleanKw = keyword.trim();
            Criteria searchCrit = new Criteria().orOperator(
                    Criteria.where("productName").regex(cleanKw, "i"),
                    Criteria.where("userFullName").regex(cleanKw, "i"),
                    Criteria.where("userEmail").regex(cleanKw, "i"),
                    Criteria.where("orderCode").regex(cleanKw, "i"),
                    Criteria.where("title").regex(cleanKw, "i")
            );
            query.addCriteria(searchCrit);
        }

        long total = mongoTemplate.count(query, ProductReview.class);

        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        query.with(pageable);

        List<ProductReview> reviews = mongoTemplate.find(query, ProductReview.class);

        List<ReviewResponse> responses = reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        int totalPages = pageable.getPageSize() > 0 ? (int) Math.ceil((double) total / pageable.getPageSize()) : 1;
        boolean isLast = (long) (pageable.getPageNumber() + 1) * pageable.getPageSize() >= total;

        return new PageResponse<>(
                responses,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                total,
                totalPages,
                isLast
        );
    }

    /**
     * Admin xem chi tiết một đánh giá.
     */
    public ReviewResponse getAdminReviewById(String reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại: " + reviewId));
        return mapToResponse(review);
    }

    /**
     * Admin duyệt hoặc từ chối đánh giá.
     */
    public ReviewResponse moderateReview(String adminUserId, String reviewId, ModerateReviewRequest req) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại: " + reviewId));

        if (review.getStatus() == ReviewStatus.DELETED) {
            throw new BadRequestException("Không thể duyệt đánh giá đã bị người dùng xóa.");
        }

        ReviewStatus targetStatus;
        try {
            targetStatus = ReviewStatus.valueOf(req.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái duyệt không hợp lệ: " + req.getStatus());
        }

        if (targetStatus != ReviewStatus.APPROVED && targetStatus != ReviewStatus.REJECTED) {
            throw new BadRequestException("Chỉ có thể duyệt thành APPROVED hoặc REJECTED.");
        }

        review.setStatus(targetStatus);
        review.setModeratedBy(adminUserId);
        review.setModeratedAt(Instant.now());
        review.setUpdatedAt(Instant.now());

        if (targetStatus == ReviewStatus.REJECTED) {
            String reason = (req.getRejectionReason() != null && !req.getRejectionReason().trim().isEmpty())
                    ? req.getRejectionReason().trim()
                    : "Nội dung không phù hợp với tiêu chuẩn đánh giá cộng đồng.";
            review.setRejectionReason(reason);
        } else {
            review.setRejectionReason(null);
        }

        ProductReview saved = reviewRepository.save(review);
        log.info("Admin {} moderated review {} to status {}", adminUserId, reviewId, targetStatus);

        // Tính toán lại ratingSummary cho sản phẩm ngay lập tức
        recomputeRatingSummary(review.getProductId());

        return mapToResponse(saved);
    }

    /**
     * Tính toán lại RatingSummary của sản phẩm một cách nguyên tử dựa trên toàn bộ đánh giá APPROVED.
     */
    public ReviewSummaryResponse recomputeRatingSummary(String productId) {
        List<ProductReview> approvedReviews = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED);
        ReviewSummaryResponse summary = calculateSummary(approvedReviews);

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            RatingSummary rs = product.getRatingSummary();
            if (rs == null) {
                rs = new RatingSummary();
            }
            rs.setAverageRating(summary.getAverageRating());
            rs.setTotalReviews(summary.getTotalReviews().intValue());
            rs.setRating1Count(summary.getRating1Count().intValue());
            rs.setRating2Count(summary.getRating2Count().intValue());
            rs.setRating3Count(summary.getRating3Count().intValue());
            rs.setRating4Count(summary.getRating4Count().intValue());
            rs.setRating5Count(summary.getRating5Count().intValue());

            product.setRatingSummary(rs);
            productRepository.save(product);
            log.info("Recomputed RatingSummary for product {}: avg={}, total={}", productId, summary.getAverageRating(), summary.getTotalReviews());
        }

        return summary;
    }

    // Helper: Tìm kiếm đơn hàng hợp lệ cho Verified Purchase
    private Optional<Order> findEligibleOrder(String userId, String productId) {
        List<Order> orders = orderRepository.findByUserIdAndOrderStatusAndPaymentStatus(
                userId, OrderStatus.DELIVERED, PaymentStatus.PAID
        );

        for (Order order : orders) {
            if (order.getItems() == null) continue;
            for (OrderItem item : order.getItems()) {
                if (productId.equals(item.getProductId())) {
                    int returned = item.getReturnedQuantity() != null ? item.getReturnedQuantity() : 0;
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    if (qty - returned > 0) {
                        return Optional.of(order);
                    }
                }
            }
        }
        return Optional.empty();
    }

    // Helper: Tính toán ReviewSummaryResponse từ danh sách reviews APPROVED
    private ReviewSummaryResponse calculateSummary(List<ProductReview> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return new ReviewSummaryResponse(0.0, 0L, 0L, 0L, 0L, 0L, 0L);
        }

        long r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;
        long sum = 0;

        for (ProductReview r : reviews) {
            int stars = r.getRating() != null ? r.getRating() : 0;
            switch (stars) {
                case 1 -> r1++;
                case 2 -> r2++;
                case 3 -> r3++;
                case 4 -> r4++;
                case 5 -> r5++;
            }
            sum += stars;
        }

        long total = reviews.size();
        double avg = total > 0 ? (double) sum / total : 0.0;
        double roundedAvg = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue();

        return new ReviewSummaryResponse(roundedAvg, total, r1, r2, r3, r4, r5);
    }

    public ReviewResponse mapToResponse(ProductReview review) {
        ReviewResponse resp = new ReviewResponse();
        resp.setId(review.getId());
        resp.setProductId(review.getProductId());
        resp.setProductName(review.getProductName());
        resp.setProductSlug(review.getProductSlug());
        resp.setProductThumbnailUrl(review.getProductThumbnailUrl());
        resp.setUserId(review.getUserId());
        resp.setUserFullName(review.getUserFullName());
        resp.setOrderId(review.getOrderId());
        resp.setOrderCode(review.getOrderCode());
        resp.setRating(review.getRating());
        resp.setTitle(review.getTitle());
        resp.setContent(review.getContent());
        resp.setIsVerifiedPurchase(review.getIsVerifiedPurchase());
        resp.setStatus(review.getStatus());
        resp.setRejectionReason(review.getRejectionReason());
        resp.setCreatedAt(review.getCreatedAt());
        resp.setUpdatedAt(review.getUpdatedAt());
        return resp;
    }
}
