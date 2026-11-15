package com.ecommerce.backend.model;

/**
 * Các trạng thái giữ hàng (Inventory Reservation) chuẩn theo Database Specification v1.2.1
 */
public enum ReservationStatus {
    PENDING,
    CONFIRMED,
    RELEASED,
    EXPIRED
}
