package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.product.ProductCreateRequest;
import com.ecommerce.backend.dto.product.ProductFilterParams;
import com.ecommerce.backend.dto.product.ProductResponse;
import com.ecommerce.backend.model.Inventory;
import com.ecommerce.backend.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = ProductController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = com.ecommerce.backend.config.SecurityConfig.class),
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/products - Returns filtered product list with pagination")
    void testGetProducts() throws Exception {
        ProductResponse response = new ProductResponse();
        response.setId("prod-1");
        response.setSku("LAP-DELL-001");
        response.setName("Dell XPS 13");
        response.setInStock(true);
        response.setInventory(new Inventory(10, 0));

        PageResponse<ProductResponse> page = new PageResponse<>(List.of(response), 0, 10, 1, 1, true);

        when(productService.getProducts(any(ProductFilterParams.class), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/products?categorySlug=laptop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].sku").value("LAP-DELL-001"));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} - Returns single product")
    void testGetProductById() throws Exception {
        ProductResponse response = new ProductResponse();
        response.setId("prod-1");
        response.setSku("LAP-DELL-001");
        response.setName("Dell XPS 13");

        when(productService.getProductById("prod-1")).thenReturn(response);

        mockMvc.perform(get("/api/v1/products/prod-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("prod-1"));
    }

    @Test
    @DisplayName("POST /api/v1/products - Creates product")
    void testCreateProduct() throws Exception {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setSku("LAP-DELL-001");
        request.setName("Dell XPS 13");
        request.setSlug("dell-xps-13");
        request.setCategoryId("cat-1");
        request.setBrandId("brand-1");
        request.setListPrice(new BigDecimal("35000000"));
        request.setSalePrice(new BigDecimal("32000000"));
        request.setInventory(new Inventory(5, 0));
        request.setAttributes(Map.of("cpu", Map.of("model", "i7")));

        ProductResponse response = new ProductResponse();
        response.setId("prod-1");
        response.setSku("LAP-DELL-001");
        response.setName("Dell XPS 13");

        when(productService.createProduct(any(ProductCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("LAP-DELL-001"));
    }

    @Test
    @DisplayName("DELETE /api/v1/products/{id} - Soft deletes product")
    void testDeleteProduct() throws Exception {
        doNothing().when(productService).deleteProduct("prod-1");

        mockMvc.perform(delete("/api/v1/products/prod-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lưu trữ/xóa sản phẩm thành công"));
    }
}
