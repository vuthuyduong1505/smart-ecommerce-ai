package com.ecommerce.backend.repository;

import com.ecommerce.backend.dto.product.ProductFilterParams;
import com.ecommerce.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepositoryCustom {
    Page<Product> findWithFilters(ProductFilterParams filter, Pageable pageable);
}

