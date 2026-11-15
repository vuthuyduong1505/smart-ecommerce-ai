package com.ecommerce.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Collection: carts
 * Database Specification v1.2.1:
 * - Quan hệ 1:0..1 với users
 * - Unique Index { userId: 1 }
 * - Tối đa 50 items
 * - Không có TTL expiration (bền vững theo user)
 */
@Document(collection = "carts")
public class Cart {

    @Id
    private String id;

    @Indexed(name = "idx_carts_user_unique", unique = true)
    private String userId;

    private List<CartItem> items = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Cart() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Cart(String userId) {
        this.userId = userId;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items != null ? items : new ArrayList<>();
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
