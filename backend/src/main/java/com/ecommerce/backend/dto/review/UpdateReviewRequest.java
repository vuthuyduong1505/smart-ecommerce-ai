package com.ecommerce.backend.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateReviewRequest {

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Integer rating;

    @NotBlank(message = "Tiêu đề đánh giá không được để trống")
    @Size(min = 3, max = 150, message = "Tiêu đề đánh giá từ 3 đến 150 ký tự")
    private String title;

    @NotBlank(message = "Nội dung đánh giá không được để trống")
    @Size(min = 10, max = 2000, message = "Nội dung đánh giá từ 10 đến 2000 ký tự")
    private String content;

    public UpdateReviewRequest() {}

    public UpdateReviewRequest(Integer rating, String title, String content) {
        this.rating = rating;
        this.title = title;
        this.content = content;
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
}
