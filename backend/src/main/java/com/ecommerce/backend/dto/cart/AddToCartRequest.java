package com.ecommerce.backend.dto.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AddToCartRequest {

    @NotBlank(message = "Product ID không được để trống")
    private String productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    @Max(value = 10, message = "Số lượng mua tối đa cho mỗi sản phẩm là 10")
    private Integer quantity = 1;

    public AddToCartRequest() {}

    public AddToCartRequest(String productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
