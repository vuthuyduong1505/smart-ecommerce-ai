package com.ecommerce.backend.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ModerateReviewRequest {

    @NotBlank(message = "Trạng thái kiểm duyệt không được để trống")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Trạng thái chỉ có thể là APPROVED hoặc REJECTED")
    private String status;

    private String rejectionReason;

    public ModerateReviewRequest() {}

    public ModerateReviewRequest(String status, String rejectionReason) {
        this.status = status;
        this.rejectionReason = rejectionReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
