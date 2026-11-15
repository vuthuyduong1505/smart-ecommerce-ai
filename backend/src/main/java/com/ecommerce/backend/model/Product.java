package com.ecommerce.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "products")
@CompoundIndexes({
    @CompoundIndex(name = "idx_products_category_status_price", def = "{'categorySlug': 1, 'status': 1, 'inStock': 1, 'salePrice': 1}"),
    @CompoundIndex(name = "idx_products_brand_price", def = "{'brandName': 1, 'status': 1, 'salePrice': 1}"),
    @CompoundIndex(name = "idx_products_laptop_usecases", def = "{'categorySlug': 1, 'attributes.useCases': 1, 'salePrice': 1}")
})
public class Product {

    @Id
    private String id;

    @Indexed(name = "idx_products_sku_unique", unique = true)
    private String sku;

    @TextIndexed(weight = 10)
    private String name;

    @Indexed(name = "idx_products_slug_unique", unique = true)
    private String slug;

    private String categoryId;
    private String categorySlug; // "laptop", "phone", "tablet", "accessories"

    private String brandId;
    private String brandName;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal listPrice;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal salePrice;

    private String currency = "VND";

    private Inventory inventory = new Inventory(0, 0);

    private Boolean inStock = false;

    private String status = "ACTIVE"; // "DRAFT", "ACTIVE", "ARCHIVED"

    private String thumbnailUrl;
    private List<String> images = new ArrayList<>();

    @TextIndexed(weight = 2)
    private String shortDescription;

    private String description;

    @TextIndexed(weight = 5)
    private List<String> tags = new ArrayList<>();

    private Map<String, Object> attributes = new HashMap<>();

    private RatingSummary ratingSummary = new RatingSummary(0.0, 0);

    private Boolean isSynthetic = false;
    private String dataOrigin = "MANUAL"; // "SYNTHETIC", "MANUAL", "SEED"

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Product() {}

    public void recalculateInStock() {
        if (this.inventory != null) {
            this.inStock = this.inventory.getAvailableStock() > 0;
        } else {
            this.inStock = false;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public void setCategorySlug(String categorySlug) {
        this.categorySlug = categorySlug;
    }

    public String getBrandId() {
        return brandId;
    }

    public void setBrandId(String brandId) {
        this.brandId = brandId;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public BigDecimal getListPrice() {
        return listPrice;
    }

    public void setListPrice(BigDecimal listPrice) {
        this.listPrice = listPrice;
    }

    public BigDecimal getSalePrice() {
        return salePrice;
    }

    public void setSalePrice(BigDecimal salePrice) {
        this.salePrice = salePrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
        recalculateInStock();
    }

    public Boolean getInStock() {
        return inStock;
    }

    public void setInStock(Boolean inStock) {
        this.inStock = inStock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images != null ? images : new ArrayList<>();
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes != null ? attributes : new HashMap<>();
    }

    public RatingSummary getRatingSummary() {
        return ratingSummary;
    }

    public void setRatingSummary(RatingSummary ratingSummary) {
        this.ratingSummary = ratingSummary;
    }

    public Boolean getIsSynthetic() {
        return isSynthetic;
    }

    public void setIsSynthetic(Boolean synthetic) {
        isSynthetic = synthetic;
    }

    public String getDataOrigin() {
        return dataOrigin;
    }

    public void setDataOrigin(String dataOrigin) {
        this.dataOrigin = dataOrigin;
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

