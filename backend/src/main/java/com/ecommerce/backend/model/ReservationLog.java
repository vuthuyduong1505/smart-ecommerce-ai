package com.ecommerce.backend.model;

import java.time.Instant;

public class ReservationLog {

    private String reservationId;
    private String status;
    private Instant createdAt;

    public ReservationLog() {
        this.createdAt = Instant.now();
    }

    public ReservationLog(String reservationId, String status) {
        this.reservationId = reservationId;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public String getReservationId() {
        return reservationId;
    }

    public void setReservationId(String reservationId) {
        this.reservationId = reservationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
