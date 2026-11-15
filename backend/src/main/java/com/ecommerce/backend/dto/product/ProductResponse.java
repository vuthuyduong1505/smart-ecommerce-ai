package com.ecommerce.backend.dto.product;

import com.ecommerce.backend.model.Inventory;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.RatingSummary;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class ProductResponse {
    private String id;
    private String sku;
    private String name;
    private String slug;
    private String categoryId;
    private String categorySlug;
    private String brandId;
    private String brandName;
    private BigDecimal listPrice;
    private BigDecimal salePrice;
    private String currency;
    private Inventory inventory;
    private Boolean inStock;
    private String status;
    private String thumbnailUrl;
    private List<String> images;
    private String shortDescription;
    private String description;
    private List<String> tags;
    private Map<String, Object> attributes;
    private RatingSummary ratingSummary;
    private Boolean isSynthetic;
    private String dataOrigin;
    private Instant createdAt;
    private Instant updatedAt;

    public ProductResponse() {}

    public static ProductResponse from(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setSku(product.getSku());
        response.setName(product.getName());
        response.setSlug(product.getSlug());
        response.setCategoryId(product.getCategoryId());
        response.setCategorySlug(product.getCategorySlug());
        response.setBrandId(product.getBrandId());
        response.setBrandName(product.getBrandName());
        response.setListPrice(product.getListPrice());
        response.setSalePrice(product.getSalePrice());
        response.setCurrency(product.getCurrency());
        response.setInventory(product.getInventory());
        response.setInStock(product.getInStock());
        response.setStatus(product.getStatus());
        response.setThumbnailUrl(product.getThumbnailUrl());
        response.setImages(product.getImages());
        response.setShortDescription(product.getShortDescription());
        response.setDescription(product.getDescription());
        response.setTags(product.getTags());
        response.setAttributes(product.getAttributes());
        response.setRatingSummary(product.getRatingSummary());
        response.setIsSynthetic(product.getIsSynthetic());
        response.setDataOrigin(product.getDataOrigin());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        return response;
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
        this.images = images;
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
        this.tags = tags;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
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

