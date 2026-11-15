package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.category.CategoryRequest;
import com.ecommerce.backend.dto.category.CategoryResponse;
import com.ecommerce.backend.dto.category.CategoryTreeResponse;
import com.ecommerce.backend.exception.DuplicateResourceException;
import com.ecommerce.backend.exception.InvalidCategoryHierarchyException;
import com.ecommerce.backend.exception.ResourceInUseException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category parentCategory;
    private Category childCategory;

    @BeforeEach
    void setUp() {
        parentCategory = new Category();
        parentCategory.setId("cat-1");
        parentCategory.setName("Laptop");
        parentCategory.setSlug("laptop");
        parentCategory.setIsActive(true);
        parentCategory.setSortOrder(1);

        childCategory = new Category();
        childCategory.setId("cat-2");
        childCategory.setName("Gaming Laptop");
        childCategory.setSlug("gaming-laptop");
        childCategory.setParentId("cat-1");
        childCategory.setIsActive(true);
        childCategory.setSortOrder(1);
    }

    @Test
    @DisplayName("Create category successfully with valid slug")
    void testCreateCategorySuccess() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Office Laptop");
        request.setSlug("office-laptop");

        when(categoryRepository.existsBySlug("office-laptop")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId("cat-new");
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("cat-new");
        assertThat(response.getSlug()).isEqualTo("office-laptop");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Create category fails when slug already exists")
    void testCreateCategoryDuplicateSlug() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Laptop");
        request.setSlug("laptop");

        when(categoryRepository.existsBySlug("laptop")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("đã tồn tại");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create category fails when parentId does not exist")
    void testCreateCategoryParentNotFound() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Sub Laptop");
        request.setSlug("sub-laptop");
        request.setParentId("non-existent-parent");

        when(categoryRepository.existsBySlug("sub-laptop")).thenReturn(false);
        when(categoryRepository.existsById("non-existent-parent")).thenReturn(false);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Danh mục cha");
    }

    @Test
    @DisplayName("Update category fails when setting parentId to itself")
    void testUpdateCategorySelfParent() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Laptop");
        request.setSlug("laptop");
        request.setParentId("cat-1");

        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(parentCategory));

        assertThatThrownBy(() -> categoryService.updateCategory("cat-1", request))
                .isInstanceOf(InvalidCategoryHierarchyException.class)
                .hasMessageContaining("không thể tự làm cha");
    }

    @Test
    @DisplayName("Update category fails on circular dependency")
    void testUpdateCategoryCircularDependency() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Laptop");
        request.setSlug("laptop");
        request.setParentId("cat-2");

        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.existsById("cat-2")).thenReturn(true);
        when(categoryRepository.findById("cat-2")).thenReturn(Optional.of(childCategory));

        assertThatThrownBy(() -> categoryService.updateCategory("cat-1", request))
                .isInstanceOf(InvalidCategoryHierarchyException.class)
                .hasMessageContaining("vòng lặp");
    }

    @Test
    @DisplayName("Get category tree builds nested hierarchy")
    void testGetCategoryTree() {
        when(categoryRepository.findAll())
                .thenReturn(List.of(parentCategory, childCategory));

        List<CategoryTreeResponse> tree = categoryService.getCategoryTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getId()).isEqualTo("cat-1");
        assertThat(tree.get(0).getChildren()).hasSize(1);
        assertThat(tree.get(0).getChildren().get(0).getId()).isEqualTo("cat-2");
    }

    @Test
    @DisplayName("Delete category fails when it has children")
    void testDeleteCategoryWithChildren() {
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.existsByParentId("cat-1")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.deleteCategory("cat-1"))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("danh mục con");

        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Delete category fails when products belong to it")
    void testDeleteCategoryWithProducts() {
        when(categoryRepository.findById("cat-2")).thenReturn(Optional.of(childCategory));
        when(categoryRepository.existsByParentId("cat-2")).thenReturn(false);
        when(productRepository.existsByCategoryId("cat-2")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.deleteCategory("cat-2"))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("sản phẩm sử dụng");

        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Delete category succeeds when leaf and no products")
    void testDeleteCategorySuccess() {
        when(categoryRepository.findById("cat-2")).thenReturn(Optional.of(childCategory));
        when(categoryRepository.existsByParentId("cat-2")).thenReturn(false);
        when(productRepository.existsByCategoryId("cat-2")).thenReturn(false);

        categoryService.deleteCategory("cat-2");

        verify(categoryRepository).deleteById("cat-2");
    }
}
