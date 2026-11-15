package com.ecommerce.backend.model;

import jakarta.validation.constraints.NotBlank;

public class ShippingAddress {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại nhận hàng không được để trống")
    private String phoneNumber;

    @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
    private String fullAddress;

    public ShippingAddress() {}

    public ShippingAddress(String receiverName, String phoneNumber, String fullAddress) {
        this.receiverName = receiverName;
        this.phoneNumber = phoneNumber;
        this.fullAddress = fullAddress;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getFullAddress() {
        return fullAddress;
    }

    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }
}
