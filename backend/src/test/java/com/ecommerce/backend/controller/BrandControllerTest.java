package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.brand.BrandRequest;
import com.ecommerce.backend.dto.brand.BrandResponse;
import com.ecommerce.backend.service.BrandService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = BrandController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = com.ecommerce.backend.config.SecurityConfig.class),
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@AutoConfigureMockMvc(addFilters = false)
class BrandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BrandService brandService;

    @Test
    @DisplayName("GET /api/v1/brands - Returns paged brands")
    void testGetBrands() throws Exception {
        BrandResponse response = new BrandResponse();
        response.setId("brand-1");
        response.setName("Apple");
        response.setSlug("apple");

        PageResponse<BrandResponse> page = new PageResponse<>(List.of(response), 0, 10, 1, 1, true);

        when(brandService.getAllBrands(eq(null), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Apple"));
    }

    @Test
    @DisplayName("GET /api/v1/brands/active - Returns active brands list")
    void testGetActiveBrands() throws Exception {
        BrandResponse response = new BrandResponse();
        response.setId("brand-1");
        response.setName("Apple");
        response.setSlug("apple");

        when(brandService.getActiveBrands()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/brands/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("brand-1"));
    }

    @Test
    @DisplayName("POST /api/v1/brands - Creates brand")
    void testCreateBrand() throws Exception {
        BrandRequest request = new BrandRequest();
        request.setName("Asus");
        request.setSlug("asus");
        request.setWebsite("https://asus.com");

        BrandResponse response = new BrandResponse();
        response.setId("brand-asus");
        response.setName("Asus");
        response.setSlug("asus");

        when(brandService.createBrand(any(BrandRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("asus"));
    }

    @Test
    @DisplayName("DELETE /api/v1/brands/{id} - Deletes brand")
    void testDeleteBrand() throws Exception {
        doNothing().when(brandService).deleteBrand("brand-1");

        mockMvc.perform(delete("/api/v1/brands/brand-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa thương hiệu thành công"));
    }
}
