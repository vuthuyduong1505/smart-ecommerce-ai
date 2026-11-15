package com.ecommerce.backend.dto.review;

public class ReviewEligibilityResponse {

    private boolean canReview;
    private boolean isVerifiedPurchase;
    private ReviewResponse existingReview;
    private String eligibleOrderId;
    private String message;

    public ReviewEligibilityResponse() {}

    public ReviewEligibilityResponse(boolean canReview, boolean isVerifiedPurchase, ReviewResponse existingReview, String eligibleOrderId, String message) {
        this.canReview = canReview;
        this.isVerifiedPurchase = isVerifiedPurchase;
        this.existingReview = existingReview;
        this.eligibleOrderId = eligibleOrderId;
        this.message = message;
    }

    public boolean isCanReview() {
        return canReview;
    }

    public void setCanReview(boolean canReview) {
        this.canReview = canReview;
    }

    public boolean isVerifiedPurchase() {
        return isVerifiedPurchase;
    }

    public void setVerifiedPurchase(boolean verifiedPurchase) {
        isVerifiedPurchase = verifiedPurchase;
    }

    public ReviewResponse getExistingReview() {
        return existingReview;
    }

    public void setExistingReview(ReviewResponse existingReview) {
        this.existingReview = existingReview;
    }

    public String getEligibleOrderId() {
        return eligibleOrderId;
    }

    public void setEligibleOrderId(String eligibleOrderId) {
        this.eligibleOrderId = eligibleOrderId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
