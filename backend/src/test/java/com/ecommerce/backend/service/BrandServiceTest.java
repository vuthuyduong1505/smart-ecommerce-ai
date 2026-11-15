package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.brand.BrandRequest;
import com.ecommerce.backend.dto.brand.BrandResponse;
import com.ecommerce.backend.exception.DuplicateResourceException;
import com.ecommerce.backend.exception.ResourceInUseException;
import com.ecommerce.backend.model.Brand;
import com.ecommerce.backend.repository.BrandRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrandServiceTest {

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private BrandService brandService;

    private Brand brand;

    @BeforeEach
    void setUp() {
        brand = new Brand();
        brand.setId("brand-1");
        brand.setName("Dell");
        brand.setSlug("dell");
        brand.setWebsite("https://dell.com");
        brand.setIsActive(true);
    }

    @Test
    @DisplayName("Create brand successfully with valid parameters")
    void testCreateBrandSuccess() {
        BrandRequest request = new BrandRequest();
        request.setName("Apple");
        request.setSlug("apple");
        request.setWebsite("https://apple.com");

        when(brandRepository.existsBySlug("apple")).thenReturn(false);
        when(brandRepository.existsByNameIgnoreCase("Apple")).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenAnswer(invocation -> {
            Brand saved = invocation.getArgument(0);
            saved.setId("brand-apple");
            return saved;
        });

        BrandResponse response = brandService.createBrand(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("brand-apple");
        assertThat(response.getSlug()).isEqualTo("apple");
        verify(brandRepository).save(any(Brand.class));
    }

    @Test
    @DisplayName("Create brand fails when name already exists")
    void testCreateBrandDuplicateName() {
        BrandRequest request = new BrandRequest();
        request.setName("Dell");
        request.setSlug("dell-new");

        when(brandRepository.existsBySlug("dell-new")).thenReturn(false);
        when(brandRepository.existsByNameIgnoreCase("Dell")).thenReturn(true);

        assertThatThrownBy(() -> brandService.createBrand(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("đã tồn tại");

        verify(brandRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create brand fails when slug already exists")
    void testCreateBrandDuplicateSlug() {
        BrandRequest request = new BrandRequest();
        request.setName("Dell Special");
        request.setSlug("dell");

        when(brandRepository.existsBySlug("dell")).thenReturn(true);

        assertThatThrownBy(() -> brandService.createBrand(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("Delete brand fails when products are linked")
    void testDeleteBrandWithProducts() {
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(brand));
        when(productRepository.existsByBrandId("brand-1")).thenReturn(true);

        assertThatThrownBy(() -> brandService.deleteBrand("brand-1"))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("sản phẩm sử dụng");

        verify(brandRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Delete brand succeeds when no products are linked")
    void testDeleteBrandSuccess() {
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(brand));
        when(productRepository.existsByBrandId("brand-1")).thenReturn(false);

        brandService.deleteBrand("brand-1");

        verify(brandRepository).deleteById("brand-1");
    }

    @Test
    @DisplayName("Get brands with search query and pagination")
    void testGetBrandsPaged() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Brand> paged = new PageImpl<>(List.of(brand), pageable, 1);

        when(brandRepository.findByNameContainingIgnoreCase("Dell", pageable)).thenReturn(paged);

        PageResponse<BrandResponse> response = brandService.getAllBrands("Dell", pageable);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Dell");
    }
}
