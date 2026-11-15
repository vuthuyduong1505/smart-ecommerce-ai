package com.ecommerce.backend.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;

/**
 * Snapshot sản phẩm trong đơn hàng (Historic Snapshotting).
 * Thay đổi thông tin sản phẩm trong tương lai không làm sai lệch đơn hàng quá khứ.
 */
public class OrderItem {

    @NotBlank(message = "Product ID không được để trống")
    private String productId;

    @NotBlank(message = "SKU không được để trống")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    private String thumbnailUrl;

    @NotNull(message = "Đơn giá không được để trống")
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal unitPrice;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer quantity;

    private Integer returnedQuantity = 0;
    private Integer refundedQuantity = 0;

    @NotNull(message = "Thành tiền không được để trống")
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal totalPrice;

    public OrderItem() {}

    public OrderItem(String productId, String sku, String productName, String thumbnailUrl,
                     BigDecimal unitPrice, Integer quantity) {
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.thumbnailUrl = thumbnailUrl;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.returnedQuantity = 0;
        this.refundedQuantity = 0;
        if (unitPrice != null && quantity != null) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
        if (this.unitPrice != null && this.quantity != null) {
            this.totalPrice = this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        }
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        if (this.unitPrice != null && this.quantity != null) {
            this.totalPrice = this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        }
    }

    public Integer getReturnedQuantity() {
        return returnedQuantity;
    }

    public void setReturnedQuantity(Integer returnedQuantity) {
        this.returnedQuantity = returnedQuantity != null ? returnedQuantity : 0;
    }

    public Integer getRefundedQuantity() {
        return refundedQuantity;
    }

    public void setRefundedQuantity(Integer refundedQuantity) {
        this.refundedQuantity = refundedQuantity != null ? refundedQuantity : 0;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}
