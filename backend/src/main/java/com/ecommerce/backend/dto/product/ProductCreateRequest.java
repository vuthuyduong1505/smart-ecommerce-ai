package com.ecommerce.backend.dto.product;

import com.ecommerce.backend.model.Inventory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ProductCreateRequest {

    @NotBlank(message = "Mã SKU không được để trống")
    @Pattern(regexp = "^[A-Z0-9_-]{4,50}$", message = "SKU phải từ 4-50 ký tự viết hoa, số, dấu gạch ngang hoặc gạch dưới")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(min = 5, max = 255, message = "Tên sản phẩm từ 5 đến 255 ký tự")
    private String name;

    @NotBlank(message = "Slug không được để trống")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug chỉ chứa chữ thường, số và dấu gạch ngang")
    private String slug;

    @NotBlank(message = "CategoryId không được để trống")
    private String categoryId;

    @NotBlank(message = "BrandId không được để trống")
    private String brandId;

    @NotNull(message = "Giá niêm yết không được để trống")
    @DecimalMin(value = "0.0", message = "Giá niêm yết không được âm")
    private BigDecimal listPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", message = "Giá bán không được âm")
    private BigDecimal salePrice;

    private String currency = "VND";

    @Valid
    private Inventory inventory = new Inventory(0, 0);

    @Pattern(regexp = "^(DRAFT|ACTIVE|ARCHIVED)$", message = "Trạng thái chỉ nhận: DRAFT, ACTIVE, ARCHIVED")
    private String status = "ACTIVE";

    private String thumbnailUrl;
    private List<String> images = new ArrayList<>();
    private String shortDescription;
    private String description;
    private List<String> tags = new ArrayList<>();
    private Map<String, Object> attributes = new HashMap<>();

    public ProductCreateRequest() {}

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

    public String getBrandId() {
        return brandId;
    }

    public void setBrandId(String brandId) {
        this.brandId = brandId;
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
}

