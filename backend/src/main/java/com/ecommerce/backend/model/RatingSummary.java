package com.ecommerce.backend.model;

public class RatingSummary {

    private Double averageRating = 0.0;
    private Integer totalReviews = 0;

    public RatingSummary() {}

    public RatingSummary(Double averageRating, Integer totalReviews) {
        this.averageRating = averageRating != null ? averageRating : 0.0;
        this.totalReviews = totalReviews != null ? totalReviews : 0;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating != null ? averageRating : 0.0;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews != null ? totalReviews : 0;
    }
}

