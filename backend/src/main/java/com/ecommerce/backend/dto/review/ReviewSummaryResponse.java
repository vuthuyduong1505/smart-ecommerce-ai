package com.ecommerce.backend.dto.review;

public class ReviewSummaryResponse {

    private Double averageRating;
    private Long totalReviews;
    private Long rating1Count;
    private Long rating2Count;
    private Long rating3Count;
    private Long rating4Count;
    private Long rating5Count;

    public ReviewSummaryResponse() {
        this.averageRating = 0.0;
        this.totalReviews = 0L;
        this.rating1Count = 0L;
        this.rating2Count = 0L;
        this.rating3Count = 0L;
        this.rating4Count = 0L;
        this.rating5Count = 0L;
    }

    public ReviewSummaryResponse(Double averageRating, Long totalReviews, Long rating1Count, Long rating2Count, Long rating3Count, Long rating4Count, Long rating5Count) {
        this.averageRating = averageRating != null ? averageRating : 0.0;
        this.totalReviews = totalReviews != null ? totalReviews : 0L;
        this.rating1Count = rating1Count != null ? rating1Count : 0L;
        this.rating2Count = rating2Count != null ? rating2Count : 0L;
        this.rating3Count = rating3Count != null ? rating3Count : 0L;
        this.rating4Count = rating4Count != null ? rating4Count : 0L;
        this.rating5Count = rating5Count != null ? rating5Count : 0L;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Long totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Long getRating1Count() {
        return rating1Count;
    }

    public void setRating1Count(Long rating1Count) {
        this.rating1Count = rating1Count;
    }

    public Long getRating2Count() {
        return rating2Count;
    }

    public void setRating2Count(Long rating2Count) {
        this.rating2Count = rating2Count;
    }

    public Long getRating3Count() {
        return rating3Count;
    }

    public void setRating3Count(Long rating3Count) {
        this.rating3Count = rating3Count;
    }

    public Long getRating4Count() {
        return rating4Count;
    }

    public void setRating4Count(Long rating4Count) {
        this.rating4Count = rating4Count;
    }

    public Long getRating5Count() {
        return rating5Count;
    }

    public void setRating5Count(Long rating5Count) {
        this.rating5Count = rating5Count;
    }
}
