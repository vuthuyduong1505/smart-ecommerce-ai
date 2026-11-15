package com.ecommerce.backend.dto.cart;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartResponse {

    private List<CartItemResponse> items = new ArrayList<>();
    private Integer totalItems = 0;
    private Integer totalQuantity = 0;
    private BigDecimal subtotal = BigDecimal.ZERO;

    public CartResponse() {}

    public List<CartItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponse> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
