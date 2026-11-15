package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.review.ModerateReviewRequest;
import com.ecommerce.backend.dto.review.ReviewResponse;
import com.ecommerce.backend.security.CustomUserDetails;
import com.ecommerce.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Admin xem danh sách đánh giá có lọc theo trạng thái, số sao, từ khóa.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getAdminReviews(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PageResponse<ReviewResponse> response = reviewService.getAdminReviews(
                keyword, status, rating, PageRequest.of(page, limit)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Admin xem chi tiết một đánh giá.
     */
    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewById(
            @PathVariable String reviewId
    ) {
        ReviewResponse review = reviewService.getAdminReviewById(reviewId);
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    /**
     * Admin duyệt hoặc từ chối đánh giá.
     */
    @PutMapping("/{reviewId}/moderation")
    public ResponseEntity<ApiResponse<ReviewResponse>> moderateReview(
            @PathVariable String reviewId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ModerateReviewRequest request
    ) {
        ReviewResponse review = reviewService.moderateReview(userDetails.getId(), reviewId, request);
        return ResponseEntity.ok(ApiResponse.success("Kiểm duyệt đánh giá thành công.", review));
    }
}
