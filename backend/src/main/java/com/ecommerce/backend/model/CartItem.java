package com.ecommerce.backend.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * Mục sản phẩm nhúng trong giỏ hàng (Cart Items)
 * Ràng buộc Database Spec v1.2.1: Số lượng từ 1 đến 10
 */
public class CartItem {

    @NotBlank(message = "Product ID không được để trống")
    private String productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    @Max(value = 10, message = "Số lượng mua tối đa cho mỗi sản phẩm là 10")
    private Integer quantity;

    private Instant addedAt;
    private Instant updatedAt;

    public CartItem() {
        this.addedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public CartItem(String productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
        this.addedAt = Instant.now();
        this.updatedAt = Instant.now();
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
        this.updatedAt = Instant.now();
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
