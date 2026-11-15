package com.ecommerce.backend.model;

/**
 * Các trạng thái thanh toán chuẩn theo Database Specification v1.2.1
 */
public enum PaymentStatus {
    UNPAID,
    PENDING_GATEWAY,
    PAID,
    FAILED,
    EXPIRED,
    PAID_LATE,
    REFUND_PENDING,
    REFUNDED,
    REFUND_FAILED
}
