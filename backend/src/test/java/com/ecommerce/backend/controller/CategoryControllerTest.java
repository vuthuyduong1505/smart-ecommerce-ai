package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.category.CategoryRequest;
import com.ecommerce.backend.dto.category.CategoryResponse;
import com.ecommerce.backend.dto.category.CategoryTreeResponse;
import com.ecommerce.backend.service.CategoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @Test
    @DisplayName("GET /api/v1/categories - Returns category list")
    void testGetCategories() throws Exception {
        CategoryResponse response = new CategoryResponse();
        response.setId("cat-1");
        response.setName("Laptop");
        response.setSlug("laptop");

        when(categoryService.getAllCategories(eq(true))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/categories?onlyActive=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("cat-1"))
                .andExpect(jsonPath("$.data[0].name").value("Laptop"));
    }

    @Test
    @DisplayName("GET /api/v1/categories/tree - Returns category hierarchy tree")
    void testGetCategoryTree() throws Exception {
        CategoryTreeResponse treeResponse = new CategoryTreeResponse();
        treeResponse.setId("cat-1");
        treeResponse.setName("Laptop");
        treeResponse.setSlug("laptop");
        treeResponse.setChildren(List.of());

        when(categoryService.getCategoryTree()).thenReturn(List.of(treeResponse));

        mockMvc.perform(get("/api/v1/categories/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("cat-1"));
    }

    @Test
    @DisplayName("POST /api/v1/categories - Creates category")
    void testCreateCategory() throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("Accessories");
        request.setSlug("accessories");

        CategoryResponse response = new CategoryResponse();
        response.setId("cat-acc");
        response.setName("Accessories");
        response.setSlug("accessories");

        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("cat-acc"))
                .andExpect(jsonPath("$.data.slug").value("accessories"));
    }

    @Test
    @DisplayName("DELETE /api/v1/categories/{id} - Deletes category")
    void testDeleteCategory() throws Exception {
        doNothing().when(categoryService).deleteCategory("cat-1");

        mockMvc.perform(delete("/api/v1/categories/cat-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa danh mục thành công"));
    }
}
