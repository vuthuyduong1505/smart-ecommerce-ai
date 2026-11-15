package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.product.ProductCreateRequest;
import com.ecommerce.backend.dto.product.ProductFilterParams;
import com.ecommerce.backend.dto.product.ProductResponse;
import com.ecommerce.backend.dto.product.ProductUpdateRequest;
import com.ecommerce.backend.exception.DuplicateResourceException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Brand;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.model.Inventory;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.repository.BrandRepository;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.validation.LaptopAttributeValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final LaptopAttributeValidator laptopAttributeValidator;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          BrandRepository brandRepository,
                          LaptopAttributeValidator laptopAttributeValidator) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.laptopAttributeValidator = laptopAttributeValidator;
    }

    public PageResponse<ProductResponse> getProducts(ProductFilterParams filter, Pageable pageable) {
        Page<Product> page = productRepository.findWithFilters(filter, pageable);
        Page<ProductResponse> responsePage = page.map(ProductResponse::from);
        return PageResponse.from(responsePage);
    }

    public ProductResponse getProductById(String id) {
        Product product = findEntityById(id);
        return ProductResponse.from(product);
    }

    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với slug: " + slug));
        return ProductResponse.from(product);
    }

    public ProductResponse createProduct(ProductCreateRequest request) {
        // 1. Kiểm tra SKU duy nhất
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Sản phẩm với mã SKU '" + request.getSku() + "' đã tồn tại");
        }

        // 2. Kiểm tra Slug duy nhất
        if (productRepository.existsBySlug(request.getSlug().trim().toLowerCase())) {
            throw new DuplicateResourceException("Sản phẩm với slug '" + request.getSlug() + "' đã tồn tại");
        }

        // 3. Kiểm tra Category tồn tại & denormalize categorySlug
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục với id: " + request.getCategoryId() + " không tồn tại"));

        // 4. Kiểm tra Brand tồn tại & denormalize brandName
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu với id: " + request.getBrandId() + " không tồn tại"));

        // 5. Kiểm tra thông số Laptop nếu thuộc danh mục laptop
        String categorySlug = category.getSlug() != null ? category.getSlug().toLowerCase() : "";
        if ("laptop".equals(categorySlug) || (category.getParentId() != null && "laptop".equals(findRootSlug(category)))) {
            laptopAttributeValidator.validate(request.getAttributes());
        }

        Product product = new Product();
        product.setSku(request.getSku().trim().toUpperCase());
        product.setName(request.getName().trim());
        product.setSlug(request.getSlug().trim().toLowerCase());
        product.setCategoryId(category.getId());
        product.setCategorySlug(categorySlug);
        product.setBrandId(brand.getId());
        product.setBrandName(brand.getName());
        product.setListPrice(request.getListPrice());
        product.setSalePrice(request.getSalePrice());
        product.setCurrency(request.getCurrency() != null ? request.getCurrency() : "VND");

        Inventory inv = request.getInventory() != null ? request.getInventory() : new Inventory(0, 0);
        product.setInventory(inv);
        product.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        product.setThumbnailUrl(request.getThumbnailUrl());
        product.setImages(request.getImages());
        product.setShortDescription(request.getShortDescription());
        product.setDescription(request.getDescription());
        product.setTags(request.getTags());
        product.setAttributes(request.getAttributes());
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        product.recalculateInStock();

        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    public ProductResponse updateProduct(String id, ProductUpdateRequest request) {
        Product product = findEntityById(id);

        // Kiểm tra slug nếu thay đổi
        if (request.getSlug() != null && !request.getSlug().equalsIgnoreCase(product.getSlug())) {
            if (productRepository.existsBySlug(request.getSlug().trim().toLowerCase())) {
                throw new DuplicateResourceException("Sản phẩm với slug '" + request.getSlug() + "' đã tồn tại");
            }
            product.setSlug(request.getSlug().trim().toLowerCase());
        }

        // Cập nhật Category nếu có
        if (request.getCategoryId() != null && !request.getCategoryId().equals(product.getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục với id: " + request.getCategoryId() + " không tồn tại"));
            product.setCategoryId(category.getId());
            product.setCategorySlug(category.getSlug().toLowerCase());
        }

        // Cập nhật Brand nếu có
        if (request.getBrandId() != null && !request.getBrandId().equals(product.getBrandId())) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu với id: " + request.getBrandId() + " không tồn tại"));
            product.setBrandId(brand.getId());
            product.setBrandName(brand.getName());
        }

        if (request.getName() != null) {
            product.setName(request.getName().trim());
        }
        if (request.getListPrice() != null) {
            product.setListPrice(request.getListPrice());
        }
        if (request.getSalePrice() != null) {
            product.setSalePrice(request.getSalePrice());
        }
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        if (request.getInventory() != null) {
            product.setInventory(request.getInventory());
        }
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }
        if (request.getThumbnailUrl() != null) {
            product.setThumbnailUrl(request.getThumbnailUrl());
        }
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }
        if (request.getShortDescription() != null) {
            product.setShortDescription(request.getShortDescription());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getTags() != null) {
            product.setTags(request.getTags());
        }
        if (request.getAttributes() != null) {
            if ("laptop".equals(product.getCategorySlug())) {
                laptopAttributeValidator.validate(request.getAttributes());
            }
            product.setAttributes(request.getAttributes());
        }

        product.setUpdatedAt(Instant.now());
        product.recalculateInStock();

        Product updated = productRepository.save(product);
        return ProductResponse.from(updated);
    }

    public void deleteProduct(String id) {
        Product product = findEntityById(id);
        // Soft delete / archive product theo quy tắc nghiệp vụ
        product.setStatus("ARCHIVED");
        product.setUpdatedAt(Instant.now());
        productRepository.save(product);
    }

    private Product findEntityById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));
    }

    private String findRootSlug(Category category) {
        String parentId = category.getParentId();
        while (parentId != null) {
            Category parent = categoryRepository.findById(parentId).orElse(null);
            if (parent == null) break;
            if (parent.getParentId() == null) {
                return parent.getSlug().toLowerCase();
            }
            parentId = parent.getParentId();
        }
        return category.getSlug().toLowerCase();
    }
}

