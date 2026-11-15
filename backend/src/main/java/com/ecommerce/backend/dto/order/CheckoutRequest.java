package com.ecommerce.backend.dto.order;

import com.ecommerce.backend.model.ShippingAddress;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class CheckoutRequest {

    @NotNull(message = "Địa chỉ nhận hàng không được để trống")
    @Valid
    private ShippingAddress shippingAddress;

    private String notes;

    private String paymentMethod = "COD";

    private String idempotencyKey;

    public CheckoutRequest() {}

    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(ShippingAddress shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
