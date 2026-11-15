package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.review.*;
import com.ecommerce.backend.security.CustomUserDetails;
import com.ecommerce.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Lấy danh sách đánh giá đã duyệt của sản phẩm (công khai).
     */
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getProductReviews(
            @PathVariable String productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PageResponse<ReviewResponse> response = reviewService.getApprovedProductReviews(
                productId, rating, sort, PageRequest.of(page, limit)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Lấy thống kê số sao và phân bố đánh giá của sản phẩm (công khai).
     */
    @GetMapping("/products/{productId}/reviews/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getProductReviewSummary(
            @PathVariable String productId
    ) {
        ReviewSummaryResponse summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Kiểm tra điều kiện viết đánh giá của người dùng hiện tại đối với sản phẩm.
     */
    @GetMapping("/products/{productId}/my-review-eligibility")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> checkEligibility(
            @PathVariable String productId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ReviewEligibilityResponse eligibility = reviewService.checkReviewEligibility(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success(eligibility));
    }

    /**
     * Gửi đánh giá mới cho sản phẩm (Yêu cầu đăng nhập và Verified Purchase).
     */
    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable String productId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse review = reviewService.createReview(userDetails.getId(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đánh giá của bạn đã được đăng thành công.", review));
    }

    /**
     * Khách hàng xem danh sách đánh giá của chính mình.
     */
    @GetMapping("/users/me/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PageResponse<ReviewResponse> response = reviewService.getMyReviews(userDetails.getId(), PageRequest.of(page, limit));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Khách hàng cập nhật đánh giá của chính mình.
     */
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateMyReview(
            @PathVariable String reviewId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        ReviewResponse review = reviewService.updateMyReview(userDetails.getId(), reviewId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá thành công.", review));
    }

    /**
     * Khách hàng xóa mềm đánh giá của mình.
     */
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteMyReview(
            @PathVariable String reviewId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        reviewService.deleteMyReview(userDetails.getId(), reviewId);
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công.", null));
    }
}
