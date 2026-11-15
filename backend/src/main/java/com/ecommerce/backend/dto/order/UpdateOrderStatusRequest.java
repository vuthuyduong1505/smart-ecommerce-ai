package com.ecommerce.backend.dto.order;

import jakarta.validation.constraints.NotBlank;

public class UpdateOrderStatusRequest {

    @NotBlank(message = "Trạng thái đơn hàng không được để trống")
    private String status;

    public UpdateOrderStatusRequest() {}

    public UpdateOrderStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
