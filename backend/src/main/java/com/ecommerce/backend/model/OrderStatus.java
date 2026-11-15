package com.ecommerce.backend.model;

/**
 * Các trạng thái đơn hàng chuẩn theo Database Specification v1.2.1
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    EXPIRED
}
