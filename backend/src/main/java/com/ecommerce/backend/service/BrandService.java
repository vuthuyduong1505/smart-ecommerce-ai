package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.brand.BrandRequest;
import com.ecommerce.backend.dto.brand.BrandResponse;
import com.ecommerce.backend.exception.DuplicateResourceException;
import com.ecommerce.backend.exception.ResourceInUseException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Brand;
import com.ecommerce.backend.repository.BrandRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    public BrandService(BrandRepository brandRepository, ProductRepository productRepository) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }

    public List<BrandResponse> getActiveBrands() {
        return brandRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(BrandResponse::from)
                .collect(Collectors.toList());
    }

    public PageResponse<BrandResponse> getAllBrands(String keyword, Pageable pageable) {
        Page<Brand> page;
        if (keyword != null && !keyword.trim().isEmpty()) {
            page = brandRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            page = brandRepository.findAll(pageable);
        }
        Page<BrandResponse> responsePage = page.map(BrandResponse::from);
        return PageResponse.from(responsePage);
    }

    public BrandResponse getBrandById(String id) {
        Brand brand = findEntityById(id);
        return BrandResponse.from(brand);
    }

    public BrandResponse getBrandBySlug(String slug) {
        Brand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với slug: " + slug));
        return BrandResponse.from(brand);
    }

    public BrandResponse createBrand(BrandRequest request) {
        if (brandRepository.existsBySlug(request.getSlug().trim().toLowerCase())) {
            throw new DuplicateResourceException("Thương hiệu với slug '" + request.getSlug() + "' đã tồn tại");
        }

        if (brandRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Thương hiệu với tên '" + request.getName() + "' đã tồn tại");
        }

        Brand brand = new Brand(
                request.getName().trim(),
                request.getSlug().trim().toLowerCase(),
                request.getDescription(),
                request.getLogoUrl(),
                request.getWebsite(),
                request.getIsActive()
        );
        brand.setCreatedAt(Instant.now());
        brand.setUpdatedAt(Instant.now());

        Brand saved = brandRepository.save(brand);
        return BrandResponse.from(saved);
    }

    public BrandResponse updateBrand(String id, BrandRequest request) {
        Brand brand = findEntityById(id);

        if (!brand.getSlug().equalsIgnoreCase(request.getSlug())
                && brandRepository.existsBySlug(request.getSlug().trim().toLowerCase())) {
            throw new DuplicateResourceException("Thương hiệu với slug '" + request.getSlug() + "' đã tồn tại");
        }

        brand.setName(request.getName().trim());
        brand.setSlug(request.getSlug().trim().toLowerCase());
        brand.setDescription(request.getDescription());
        brand.setLogoUrl(request.getLogoUrl());
        brand.setWebsite(request.getWebsite());
        if (request.getIsActive() != null) {
            brand.setIsActive(request.getIsActive());
        }
        brand.setUpdatedAt(Instant.now());

        Brand updated = brandRepository.save(brand);
        return BrandResponse.from(updated);
    }

    public void deleteBrand(String id) {
        findEntityById(id);

        if (productRepository.existsByBrandId(id)) {
            throw new ResourceInUseException("Không thể xóa thương hiệu đang được sản phẩm sử dụng");
        }

        brandRepository.deleteById(id);
    }

    private Brand findEntityById(String id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với id: " + id));
    }
}

