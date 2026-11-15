package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.product.ProductCreateRequest;
import com.ecommerce.backend.dto.product.ProductFilterParams;
import com.ecommerce.backend.dto.product.ProductResponse;
import com.ecommerce.backend.dto.product.ProductUpdateRequest;
import com.ecommerce.backend.exception.BadRequestException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BrandRepository brandRepository;

    @Spy
    private LaptopAttributeValidator laptopAttributeValidator = new LaptopAttributeValidator();

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Brand brand;
    private Map<String, Object> validLaptopAttributes;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId("cat-1");
        category.setName("Laptop");
        category.setSlug("laptop");
        category.setIsActive(true);

        brand = new Brand();
        brand.setId("brand-1");
        brand.setName("Dell");
        brand.setSlug("dell");
        brand.setIsActive(true);

        validLaptopAttributes = new HashMap<>();
        validLaptopAttributes.put("cpu", Map.of(
                "model", "Intel Core i7-13700H",
                "cores", 14,
                "boostClockGhz", 5.0
        ));
        validLaptopAttributes.put("gpu", Map.of(
                "model", "NVIDIA GeForce RTX 4060",
                "vramGb", 8
        ));
        validLaptopAttributes.put("ram", Map.of(
                "capacityGb", 16,
                "ramType", "DDR5"
        ));
        validLaptopAttributes.put("storage", Map.of(
                "capacityGb", 512,
                "storageType", "NVMe PCIe 4.0 SSD"
        ));
        validLaptopAttributes.put("display", Map.of(
                "sizeInches", 15.6,
                "resolution", "1920x1080",
                "refreshRateHz", 144
        ));
        validLaptopAttributes.put("battery", Map.of(
                "capacityWh", 86
        ));
        validLaptopAttributes.put("physical", Map.of(
                "weightKg", 2.2
        ));
        validLaptopAttributes.put("useCases", List.of("GAMING", "OFFICE"));
    }

    private ProductCreateRequest createSampleRequest() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setSku("LAP-DELL-G15-001");
        request.setName("Dell G15 5530");
        request.setSlug("dell-g15-5530");
        request.setCategoryId("cat-1");
        request.setBrandId("brand-1");
        request.setListPrice(new BigDecimal("28990000"));
        request.setSalePrice(new BigDecimal("26490000"));
        request.setInventory(new Inventory(10, 0));
        request.setAttributes(validLaptopAttributes);
        return request;
    }

    @Test
    @DisplayName("Create product successfully with valid laptop attributes and auto-stock calculation")
    void testCreateProductSuccess() {
        ProductCreateRequest request = createSampleRequest();

        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productRepository.existsBySlug(request.getSlug())).thenReturn(false);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(category));
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(brand));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId("prod-1");
            return p;
        });

        ProductResponse response = productService.createProduct(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("prod-1");
        assertThat(response.getSku()).isEqualTo("LAP-DELL-G15-001");
        assertThat(response.getInStock()).isTrue();
        assertThat(response.getCategorySlug()).isEqualTo("laptop");
        assertThat(response.getBrandName()).isEqualTo("Dell");
        assertThat(response.getInventory().getAvailableStock()).isEqualTo(10);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Create product fails on duplicate SKU")
    void testCreateProductDuplicateSku() {
        ProductCreateRequest request = createSampleRequest();
        when(productRepository.existsBySku(request.getSku())).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("SKU");

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create product fails when category not found")
    void testCreateProductCategoryNotFound() {
        ProductCreateRequest request = createSampleRequest();
        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productRepository.existsBySlug(request.getSlug())).thenReturn(false);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Danh mục");
    }

    @Test
    @DisplayName("Create product fails when brand not found")
    void testCreateProductBrandNotFound() {
        ProductCreateRequest request = createSampleRequest();
        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productRepository.existsBySlug(request.getSlug())).thenReturn(false);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(category));
        when(brandRepository.findById("brand-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Thương hiệu");
    }

    @Test
    @DisplayName("Create product fails when laptop attributes has invalid useCase")
    void testCreateProductInvalidUseCase() {
        ProductCreateRequest request = createSampleRequest();
        validLaptopAttributes.put("useCases", List.of("INVALID_USE_CASE"));
        request.setAttributes(validLaptopAttributes);

        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productRepository.existsBySlug(request.getSlug())).thenReturn(false);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(category));
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(brand));

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Nhu cầu sử dụng không hợp lệ");
    }

    @Test
    @DisplayName("Create product fails when laptop attributes missing required block")
    void testCreateProductMissingAttributeBlock() {
        ProductCreateRequest request = createSampleRequest();
        validLaptopAttributes.remove("cpu");
        request.setAttributes(validLaptopAttributes);

        when(productRepository.existsBySku(request.getSku())).thenReturn(false);
        when(productRepository.existsBySlug(request.getSlug())).thenReturn(false);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(category));
        when(brandRepository.findById("brand-1")).thenReturn(Optional.of(brand));

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("CPU");
    }

    @Test
    @DisplayName("Update product calculates stock properly when reserved equals quantity")
    void testUpdateProductZeroAvailableStock() {
        Product product = new Product();
        product.setId("prod-1");
        product.setSku("LAP-DELL-G15-001");
        product.setInventory(new Inventory(10, 10)); // available = 0
        product.setCategorySlug("laptop");
        product.setBrandName("Dell");

        ProductUpdateRequest updateRequest = new ProductUpdateRequest();
        updateRequest.setInventory(new Inventory(10, 10));

        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.updateProduct("prod-1", updateRequest);

        assertThat(response.getInStock()).isFalse();
        assertThat(response.getInventory().getAvailableStock()).isZero();
    }

    @Test
    @DisplayName("Soft delete (archive) product sets status to ARCHIVED")
    void testDeleteProductArchive() {
        Product product = new Product();
        product.setId("prod-1");
        product.setStatus("ACTIVE");

        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        productService.deleteProduct("prod-1");

        assertThat(product.getStatus()).isEqualTo("ARCHIVED");
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("Filter products calls dynamic repository query")
    void testFilterProducts() {
        ProductFilterParams params = new ProductFilterParams();
        params.setCategorySlug("laptop");
        Pageable pageable = PageRequest.of(0, 10);

        Product product = new Product();
        product.setId("prod-1");
        product.setName("Dell G15 5530");
        product.setCategorySlug("laptop");
        product.setBrandName("Dell");

        Page<Product> paged = new PageImpl<>(List.of(product), pageable, 1);
        when(productRepository.findWithFilters(any(ProductFilterParams.class), any(Pageable.class))).thenReturn(paged);

        PageResponse<ProductResponse> result = productService.getProducts(params, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Dell G15 5530");
    }
}
