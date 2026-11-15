package com.ecommerce.backend.model;

public class RatingSummary {

    private Double averageRating = 0.0;
    private Integer totalReviews = 0;
    private Integer rating1Count = 0;
    private Integer rating2Count = 0;
    private Integer rating3Count = 0;
    private Integer rating4Count = 0;
    private Integer rating5Count = 0;

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

    public Integer getRating1Count() {
        return rating1Count;
    }

    public void setRating1Count(Integer rating1Count) {
        this.rating1Count = rating1Count != null ? rating1Count : 0;
    }

    public Integer getRating2Count() {
        return rating2Count;
    }

    public void setRating2Count(Integer rating2Count) {
        this.rating2Count = rating2Count != null ? rating2Count : 0;
    }

    public Integer getRating3Count() {
        return rating3Count;
    }

    public void setRating3Count(Integer rating3Count) {
        this.rating3Count = rating3Count != null ? rating3Count : 0;
    }

    public Integer getRating4Count() {
        return rating4Count;
    }

    public void setRating4Count(Integer rating4Count) {
        this.rating4Count = rating4Count != null ? rating4Count : 0;
    }

    public Integer getRating5Count() {
        return rating5Count;
    }

    public void setRating5Count(Integer rating5Count) {
        this.rating5Count = rating5Count != null ? rating5Count : 0;
    }
}
