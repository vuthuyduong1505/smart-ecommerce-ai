package com.ecommerce.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Collection: product_reviews
 * Tuân thủ Database Specification v1.2.1 và Index Strategy:
 * - idx_reviews_product_created: { productId: 1, status: 1, createdAt: -1 }
 * - idx_reviews_user_created: { userId: 1, createdAt: -1 }
 * - idx_reviews_active_user_product_unique: { userId: 1, productId: 1 } (Partial Unique cho PENDING, APPROVED, REJECTED)
 */
@Document(collection = "product_reviews")
@CompoundIndexes({
    @CompoundIndex(name = "idx_reviews_product_created", def = "{'productId': 1, 'status': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "idx_reviews_user_created", def = "{'userId': 1, 'createdAt': -1}"),
    @CompoundIndex(
        name = "idx_reviews_active_user_product_unique",
        def = "{'userId': 1, 'productId': 1}",
        unique = true,
        partialFilter = "{'status': {'$in': ['PENDING', 'APPROVED', 'REJECTED']}}"
    )
})
public class ProductReview {

    @Id
    private String id;

    private String userId;
    private String userFullName;
    private String userEmail;

    private String productId;
    private String productName;
    private String productSlug;
    private String productThumbnailUrl;

    private String orderId;
    private String orderCode;

    private Integer rating; // 1 -> 5
    private String title;
    private String content;

    private Boolean isVerifiedPurchase = true;

    private ReviewStatus status = ReviewStatus.PENDING;

    private String moderatedBy;
    private Instant moderatedAt;
    private String rejectionReason;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public ProductReview() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductSlug() {
        return productSlug;
    }

    public void setProductSlug(String productSlug) {
        this.productSlug = productSlug;
    }

    public String getProductThumbnailUrl() {
        return productThumbnailUrl;
    }

    public void setProductThumbnailUrl(String productThumbnailUrl) {
        this.productThumbnailUrl = productThumbnailUrl;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsVerifiedPurchase() {
        return isVerifiedPurchase;
    }

    public void setIsVerifiedPurchase(Boolean isVerifiedPurchase) {
        this.isVerifiedPurchase = isVerifiedPurchase;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }

    public String getModeratedBy() {
        return moderatedBy;
    }

    public void setModeratedBy(String moderatedBy) {
        this.moderatedBy = moderatedBy;
    }

    public Instant getModeratedAt() {
        return moderatedAt;
    }

    public void setModeratedAt(Instant moderatedAt) {
        this.moderatedAt = moderatedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
