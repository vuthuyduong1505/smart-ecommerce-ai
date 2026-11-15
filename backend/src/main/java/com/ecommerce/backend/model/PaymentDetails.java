package com.ecommerce.backend.model;

import java.time.Instant;

public class PaymentDetails {

    private String method = "COD"; // "COD", "VNPAY", "MOMO", "BANK_TRANSFER"
    private String gatewayTransactionId;
    private Instant paidAt;
    private Object refund;

    public PaymentDetails() {}

    public PaymentDetails(String method) {
        this.method = method != null ? method : "COD";
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Object getRefund() {
        return refund;
    }

    public void setRefund(Object refund) {
        this.refund = refund;
    }
}
