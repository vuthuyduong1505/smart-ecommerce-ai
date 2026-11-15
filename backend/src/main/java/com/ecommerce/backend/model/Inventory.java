package com.ecommerce.backend.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class Inventory {

    @NotNull(message = "Số lượng tồn kho không được null")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer quantity = 0;

    @NotNull(message = "Số lượng giữ không được null")
    @Min(value = 0, message = "Số lượng giữ không được âm")
    private Integer reserved = 0;

    public Inventory() {}

    public Inventory(Integer quantity, Integer reserved) {
        this.quantity = quantity != null ? quantity : 0;
        this.reserved = reserved != null ? reserved : 0;
    }

    public Integer getAvailableStock() {
        int q = quantity != null ? quantity : 0;
        int r = reserved != null ? reserved : 0;
        return q - r;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity != null ? quantity : 0;
    }

    public Integer getReserved() {
        return reserved;
    }

    public void setReserved(Integer reserved) {
        this.reserved = reserved != null ? reserved : 0;
    }
}

