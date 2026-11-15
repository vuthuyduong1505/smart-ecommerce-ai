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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private ReviewService reviewService;

    private User sampleUser;
    private Product sampleProduct;
    private Order sampleDeliveredOrder;
    private OrderItem sampleOrderItem;

    @BeforeEach
    void setUp() {
        sampleUser = new User("user@test.com", "hash", "Nguyen Van A", "ROLE_CUSTOMER", "ACTIVE");
        sampleUser.setId("user123");

        sampleProduct = new Product();
        sampleProduct.setId("prod123");
        sampleProduct.setName("Laptop Gaming Legion 5");
        sampleProduct.setSlug("laptop-gaming-legion-5");
        sampleProduct.setRatingSummary(new RatingSummary(0.0, 0));

        sampleOrderItem = new OrderItem();
        sampleOrderItem.setProductId("prod123");
        sampleOrderItem.setProductName("Laptop Gaming Legion 5");
        sampleOrderItem.setQuantity(2);
        sampleOrderItem.setReturnedQuantity(0);

        sampleDeliveredOrder = new Order();
        sampleDeliveredOrder.setId("order123");
        sampleDeliveredOrder.setOrderCode("ORD-20261116-0001");
        sampleDeliveredOrder.setUserId("user123");
        sampleDeliveredOrder.setOrderStatus(OrderStatus.DELIVERED);
        sampleDeliveredOrder.setPaymentStatus(PaymentStatus.PAID);
        sampleDeliveredOrder.setItems(List.of(sampleOrderItem));
    }

    // 1. checkReviewEligibility - User eligible
    @Test
    @DisplayName("Kiểm tra điều kiện: Khách đã nhận hàng thành công -> đủ điều kiện đánh giá")
    void checkReviewEligibility_eligibleUser_returnsCanReviewTrue() {
        when(productRepository.existsById("prod123")).thenReturn(true);
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(List.of(sampleDeliveredOrder));

        ReviewEligibilityResponse resp = reviewService.checkReviewEligibility("user123", "prod123");

        assertTrue(resp.isCanReview());
        assertTrue(resp.isVerifiedPurchase());
        assertEquals("order123", resp.getEligibleOrderId());
        assertNull(resp.getExistingReview());
    }

    // 2. checkReviewEligibility - Product not found
    @Test
    @DisplayName("Kiểm tra điều kiện: Sản phẩm không tồn tại -> ném ResourceNotFoundException")
    void checkReviewEligibility_productNotFound_throwsResourceNotFoundException() {
        when(productRepository.existsById("prod_unknown")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.checkReviewEligibility("user123", "prod_unknown")
        );
    }

    // 3. checkReviewEligibility - User has not purchased
    @Test
    @DisplayName("Kiểm tra điều kiện: Khách chưa mua sản phẩm -> canReview = false")
    void checkReviewEligibility_unpurchasedUser_returnsCanReviewFalse() {
        when(productRepository.existsById("prod123")).thenReturn(true);
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(Collections.emptyList());

        ReviewEligibilityResponse resp = reviewService.checkReviewEligibility("user123", "prod123");

        assertFalse(resp.isCanReview());
        assertFalse(resp.isVerifiedPurchase());
        assertNull(resp.getEligibleOrderId());
    }

    // 4. checkReviewEligibility - Order fully returned
    @Test
    @DisplayName("Kiểm tra điều kiện: Đơn hàng đã trả hàng toàn bộ (returnedQuantity >= quantity) -> canReview = false")
    void checkReviewEligibility_fullyReturnedItem_returnsCanReviewFalse() {
        sampleOrderItem.setReturnedQuantity(2); // Trả hết 2/2 cái
        when(productRepository.existsById("prod123")).thenReturn(true);
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(List.of(sampleDeliveredOrder));

        ReviewEligibilityResponse resp = reviewService.checkReviewEligibility("user123", "prod123");

        assertFalse(resp.isCanReview());
    }

    // 5. checkReviewEligibility - Partial return
    @Test
    @DisplayName("Kiểm tra điều kiện: Trả hàng 1 phần (returnedQuantity < quantity) -> vẫn đủ điều kiện")
    void checkReviewEligibility_partiallyReturnedItem_returnsCanReviewTrue() {
        sampleOrderItem.setReturnedQuantity(1); // Mua 2 trả 1, còn giữ 1
        when(productRepository.existsById("prod123")).thenReturn(true);
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(List.of(sampleDeliveredOrder));

        ReviewEligibilityResponse resp = reviewService.checkReviewEligibility("user123", "prod123");

        assertTrue(resp.isCanReview());
        assertTrue(resp.isVerifiedPurchase());
    }

    // 6. checkReviewEligibility - Existing active review
    @Test
    @DisplayName("Kiểm tra điều kiện: Đã có đánh giá đang active -> canReview = false, trả về existingReview")
    void checkReviewEligibility_existingActiveReview_returnsCanReviewFalseWithExistingReview() {
        ProductReview activeReview = new ProductReview();
        activeReview.setId("rev001");
        activeReview.setUserId("user123");
        activeReview.setProductId("prod123");
        activeReview.setStatus(ReviewStatus.PENDING);
        activeReview.setOrderId("order123");

        when(productRepository.existsById("prod123")).thenReturn(true);
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.of(activeReview));

        ReviewEligibilityResponse resp = reviewService.checkReviewEligibility("user123", "prod123");

        assertFalse(resp.isCanReview());
        assertTrue(resp.isVerifiedPurchase());
        assertNotNull(resp.getExistingReview());
        assertEquals("rev001", resp.getExistingReview().getId());
    }

    // 7. createReview - Successful creation
    @Test
    @DisplayName("Tạo đánh giá: Khách đủ điều kiện -> tạo thành công với status APPROVED và tự động cập nhật ratingSummary")
    void createReview_eligibleUser_createsApprovedReview() {
        CreateReviewRequest req = new CreateReviewRequest(5, "Laptop rất tuyệt vời", "Máy chạy mượt mà, tản nhiệt rất mát.");

        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(List.of(sampleDeliveredOrder));
        when(userRepository.findById("user123")).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(invocation -> {
            ProductReview r = invocation.getArgument(0);
            r.setId("rev123");
            return r;
        });
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED)).thenReturn(Collections.emptyList());

        ReviewResponse resp = reviewService.createReview("user123", "prod123", req);

        assertNotNull(resp);
        assertEquals("rev123", resp.getId());
        assertEquals(ReviewStatus.APPROVED, resp.getStatus());
        assertTrue(resp.getIsVerifiedPurchase());
        assertEquals(5, resp.getRating());
        assertEquals("Laptop rất tuyệt vời", resp.getTitle());
        assertEquals("order123", resp.getOrderId());
        assertEquals("ORD-20261116-0001", resp.getOrderCode());

        // Verify that product ratingSummary is updated immediately
        verify(productRepository).save(any(Product.class));
    }

    // 8. createReview - Duplicate active review
    @Test
    @DisplayName("Tạo đánh giá: Đã có đánh giá active -> ném BadRequestException")
    void createReview_duplicateActiveReview_throwsBadRequestException() {
        ProductReview existing = new ProductReview();
        existing.setStatus(ReviewStatus.APPROVED);

        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.of(existing));

        CreateReviewRequest req = new CreateReviewRequest(5, "Đánh giá thứ 2", "Nội dung hợp lệ...");

        assertThrows(BadRequestException.class, () ->
                reviewService.createReview("user123", "prod123", req)
        );
    }

    // 9. createReview - Not eligible
    @Test
    @DisplayName("Tạo đánh giá: Chưa nhận hàng thành công -> ném BadRequestException")
    void createReview_notEligible_throwsBadRequestException() {
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));
        when(reviewRepository.findByUserIdAndProductIdAndStatusIn(eq("user123"), eq("prod123"), anyCollection()))
                .thenReturn(Optional.empty());
        when(orderRepository.findByUserIdAndOrderStatusAndPaymentStatus("user123", OrderStatus.DELIVERED, PaymentStatus.PAID))
                .thenReturn(Collections.emptyList());

        CreateReviewRequest req = new CreateReviewRequest(4, "Tiêu đề hợp lệ", "Nội dung hợp lệ...");

        assertThrows(BadRequestException.class, () ->
                reviewService.createReview("user123", "prod123", req)
        );
    }

    // 10. getMyReviews - List reviews
    @Test
    @DisplayName("Xem đánh giá của tôi: Trả về danh sách reviews không bao gồm DELETED")
    void getMyReviews_returnsUserReviewsExcludingDeleted() {
        ProductReview r1 = new ProductReview();
        r1.setId("r1");
        r1.setStatus(ReviewStatus.APPROVED);

        Page<ProductReview> page = new PageImpl<>(List.of(r1), PageRequest.of(0, 10), 1);
        when(reviewRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(eq("user123"), eq(ReviewStatus.DELETED), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<ReviewResponse> resp = reviewService.getMyReviews("user123", PageRequest.of(0, 10));

        assertEquals(1, resp.getContent().size());
        assertEquals("r1", resp.getContent().get(0).getId());
    }

    // 11. updateMyReview - Updates content, keeps APPROVED and recomputes summary
    @Test
    @DisplayName("Sửa đánh giá: Cập nhật nội dung, status APPROVED và tính lại ratingSummary của sản phẩm")
    void updateMyReview_updatesContentAndRecomputesSummary() {
        ProductReview existing = new ProductReview();
        existing.setId("rev1");
        existing.setUserId("user123");
        existing.setProductId("prod123");
        existing.setStatus(ReviewStatus.APPROVED);
        existing.setRating(3);
        existing.setTitle("Tiêu đề cũ");

        when(reviewRepository.findByIdAndUserIdAndStatusNot("rev1", "user123", ReviewStatus.DELETED))
                .thenReturn(Optional.of(existing));
        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED)).thenReturn(Collections.emptyList());
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));

        UpdateReviewRequest req = new UpdateReviewRequest(4, "Tiêu đề mới hơn", "Nội dung cập nhật mới.");
        ReviewResponse resp = reviewService.updateMyReview("user123", "rev1", req);

        assertEquals(4, resp.getRating());
        assertEquals("Tiêu đề mới hơn", resp.getTitle());
        assertEquals(ReviewStatus.APPROVED, resp.getStatus());
        verify(productRepository).save(any(Product.class));
    }

    // 13. updateMyReview - Not owner (IDOR)
    @Test
    @DisplayName("Sửa đánh giá của người khác: Ném ResourceNotFoundException (bảo mật IDOR)")
    void updateMyReview_notOwner_throwsResourceNotFoundException() {
        when(reviewRepository.findByIdAndUserIdAndStatusNot("rev1", "other_user", ReviewStatus.DELETED))
                .thenReturn(Optional.empty());

        UpdateReviewRequest req = new UpdateReviewRequest(5, "Hack review", "Nội dung hack...");
        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.updateMyReview("other_user", "rev1", req)
        );
    }

    // 14. deleteMyReview - Soft delete and recompute if APPROVED
    @Test
    @DisplayName("Xóa mềm đánh giá: Chuyển sang status DELETED và tính lại ratingSummary nếu trước đó APPROVED")
    void deleteMyReview_softDeletesReviewAndRecomputesSummaryIfApproved() {
        ProductReview existing = new ProductReview();
        existing.setId("rev1");
        existing.setUserId("user123");
        existing.setProductId("prod123");
        existing.setStatus(ReviewStatus.APPROVED);

        when(reviewRepository.findByIdAndUserIdAndStatusNot("rev1", "user123", ReviewStatus.DELETED))
                .thenReturn(Optional.of(existing));
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED)).thenReturn(Collections.emptyList());
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));

        reviewService.deleteMyReview("user123", "rev1");

        assertEquals(ReviewStatus.DELETED, existing.getStatus());
        verify(reviewRepository).save(existing);
        verify(productRepository).save(sampleProduct);
    }

    // 15. deleteMyReview - Not owner
    @Test
    @DisplayName("Xóa đánh giá của người khác: Ném ResourceNotFoundException (bảo mật IDOR)")
    void deleteMyReview_notOwner_throwsResourceNotFoundException() {
        when(reviewRepository.findByIdAndUserIdAndStatusNot("rev1", "other_user", ReviewStatus.DELETED))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.deleteMyReview("other_user", "rev1")
        );
    }

    // 16. moderateReview - Admin approves
    @Test
    @DisplayName("Admin duyệt APPROVED: Cập nhật status, moderator, tính lại ratingSummary của sản phẩm")
    void moderateReview_approve_updatesStatusAndModeratorAndRecomputesSummary() {
        ProductReview review = new ProductReview();
        review.setId("rev1");
        review.setProductId("prod123");
        review.setRating(5);
        review.setStatus(ReviewStatus.PENDING);

        when(reviewRepository.findById("rev1")).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED)).thenReturn(List.of(review));
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));

        ModerateReviewRequest req = new ModerateReviewRequest("APPROVED", null);
        ReviewResponse resp = reviewService.moderateReview("admin_id", "rev1", req);

        assertEquals(ReviewStatus.APPROVED, resp.getStatus());
        verify(productRepository).save(sampleProduct);
        assertEquals(5.0, sampleProduct.getRatingSummary().getAverageRating());
        assertEquals(1, sampleProduct.getRatingSummary().getTotalReviews());
        assertEquals(1, sampleProduct.getRatingSummary().getRating5Count());
    }

    // 17. moderateReview - Admin rejects with reason
    @Test
    @DisplayName("Admin duyệt REJECTED: Cập nhật status, lý do từ chối, tính lại ratingSummary")
    void moderateReview_reject_updatesStatusWithReasonAndRecomputesSummary() {
        ProductReview review = new ProductReview();
        review.setId("rev1");
        review.setProductId("prod123");
        review.setStatus(ReviewStatus.PENDING);

        when(reviewRepository.findById("rev1")).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED)).thenReturn(Collections.emptyList());
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));

        ModerateReviewRequest req = new ModerateReviewRequest("REJECTED", "Ngôn từ thô tục, không liên quan đến sản phẩm.");
        ReviewResponse resp = reviewService.moderateReview("admin_id", "rev1", req);

        assertEquals(ReviewStatus.REJECTED, resp.getStatus());
        assertEquals("Ngôn từ thô tục, không liên quan đến sản phẩm.", resp.getRejectionReason());
        verify(productRepository).save(sampleProduct);
    }

    // 18. moderateReview - Cannot moderate DELETED review
    @Test
    @DisplayName("Admin duyệt đánh giá đã bị user xóa mềm: Ném BadRequestException")
    void moderateReview_deletedReview_throwsBadRequestException() {
        ProductReview review = new ProductReview();
        review.setId("rev1");
        review.setStatus(ReviewStatus.DELETED);

        when(reviewRepository.findById("rev1")).thenReturn(Optional.of(review));

        ModerateReviewRequest req = new ModerateReviewRequest("APPROVED", null);
        assertThrows(BadRequestException.class, () ->
                reviewService.moderateReview("admin_id", "rev1", req)
        );
    }

    // 19. recomputeRatingSummary - Correct distribution and rounding
    @Test
    @DisplayName("Tính toán RatingSummary: Đúng phân bố số sao 1->5 và làm tròn 1 chữ số thập phân")
    void recomputeRatingSummary_multipleApprovedReviews_correctlyAggregatesDistributionAndAverage() {
        ProductReview r1 = new ProductReview(); r1.setRating(5);
        ProductReview r2 = new ProductReview(); r2.setRating(5);
        ProductReview r3 = new ProductReview(); r3.setRating(4);
        ProductReview r4 = new ProductReview(); r4.setRating(3);
        ProductReview r5 = new ProductReview(); r5.setRating(1);

        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED))
                .thenReturn(List.of(r1, r2, r3, r4, r5));
        when(productRepository.findById("prod123")).thenReturn(Optional.of(sampleProduct));

        ReviewSummaryResponse summary = reviewService.recomputeRatingSummary("prod123");

        // Sum = 5 + 5 + 4 + 3 + 1 = 18. Count = 5. Average = 18 / 5 = 3.6
        assertEquals(5L, summary.getTotalReviews());
        assertEquals(3.6, summary.getAverageRating());
        assertEquals(1L, summary.getRating1Count());
        assertEquals(0L, summary.getRating2Count());
        assertEquals(1L, summary.getRating3Count());
        assertEquals(1L, summary.getRating4Count());
        assertEquals(2L, summary.getRating5Count());

        verify(productRepository).save(sampleProduct);
        assertEquals(3.6, sampleProduct.getRatingSummary().getAverageRating());
        assertEquals(5, sampleProduct.getRatingSummary().getTotalReviews());
    }

    // 20. getApprovedProductReviews - Filter and sort
    @Test
    @DisplayName("Lấy đánh giá đã duyệt: Lọc theo rating và phân trang")
    void getApprovedProductReviews_withRatingFilter_callsRepositoryCorrectly() {
        ProductReview r = new ProductReview();
        r.setId("rev5");
        r.setRating(5);
        r.setStatus(ReviewStatus.APPROVED);

        Page<ProductReview> page = new PageImpl<>(List.of(r), PageRequest.of(0, 10), 1);
        when(reviewRepository.findByProductIdAndStatusAndRating(eq("prod123"), eq(ReviewStatus.APPROVED), eq(5), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<ReviewResponse> resp = reviewService.getApprovedProductReviews("prod123", 5, "newest", PageRequest.of(0, 10));

        assertEquals(1, resp.getContent().size());
        assertEquals(5, resp.getContent().get(0).getRating());
    }

    // 21. getProductReviewSummary - Zero reviews returns empty summary
    @Test
    @DisplayName("Lấy thống kê đánh giá khi chưa có đánh giá nào: Trả về summary 0.0 sao và 0 lượt")
    void getProductReviewSummary_noReviews_returnsZeroSummary() {
        when(reviewRepository.findByProductIdAndStatus("prod123", ReviewStatus.APPROVED))
                .thenReturn(Collections.emptyList());

        ReviewSummaryResponse summary = reviewService.getProductReviewSummary("prod123");

        assertEquals(0.0, summary.getAverageRating());
        assertEquals(0L, summary.getTotalReviews());
        assertEquals(0L, summary.getRating5Count());
    }
}
