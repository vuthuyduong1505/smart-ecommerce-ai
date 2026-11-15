package com.ecommerce.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Collection: orders
 * Database Specification v1.2.1:
 * - orderCode: ^ORD-[0-9]{8}-[A-Z0-9]{4}$
 * - idempotencyKey: Unique Index chống trùng lặp đơn hàng
 * - Compound Index { userId: 1, createdAt: -1 } (ESR cho lịch sử mua hàng)
 * - Compound Index { orderStatus: 1, paymentStatus: 1, reservationStatus: 1, expiresAt: 1 } (quét đơn hết hạn)
 */
@Document(collection = "orders")
@CompoundIndexes({
    @CompoundIndex(name = "idx_orders_user_created", def = "{'userId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "idx_orders_expiration_poll", def = "{'orderStatus': 1, 'paymentStatus': 1, 'reservationStatus': 1, 'expiresAt': 1}")
})
public class Order {

    @Id
    private String id;

    @Indexed(name = "idx_orders_code_unique", unique = true)
    private String orderCode;

    @Indexed(name = "idx_orders_idempotency_unique", unique = true)
    private String idempotencyKey;

    private String userId;

    private String activeReservationId;

    private ReservationStatus reservationStatus = ReservationStatus.PENDING;

    private List<ReservationLog> reservationHistory = new ArrayList<>();

    private OrderStatus orderStatus = OrderStatus.PENDING;

    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private ShippingAddress shippingAddress;

    private PaymentDetails payment = new PaymentDetails("COD");

    private List<OrderItem> items = new ArrayList<>();

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal subtotal;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal grandTotal;

    private String notes;

    private Instant expiresAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Order() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getActiveReservationId() {
        return activeReservationId;
    }

    public void setActiveReservationId(String activeReservationId) {
        this.activeReservationId = activeReservationId;
    }

    public ReservationStatus getReservationStatus() {
        return reservationStatus;
    }

    public void setReservationStatus(ReservationStatus reservationStatus) {
        this.reservationStatus = reservationStatus;
    }

    public List<ReservationLog> getReservationHistory() {
        return reservationHistory;
    }

    public void setReservationHistory(List<ReservationLog> reservationHistory) {
        this.reservationHistory = reservationHistory != null ? reservationHistory : new ArrayList<>();
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(ShippingAddress shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public PaymentDetails getPayment() {
        return payment;
    }

    public void setPayment(PaymentDetails payment) {
        this.payment = payment;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
