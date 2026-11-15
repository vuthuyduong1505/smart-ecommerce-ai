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
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAllCategories(Boolean onlyActive) {
        List<Category> categories;
        if (Boolean.TRUE.equals(onlyActive)) {
            categories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        } else {
            categories = categoryRepository.findAll();
        }
        return categories.stream().map(CategoryResponse::from).collect(Collectors.toList());
    }

    public List<CategoryTreeResponse> getCategoryTree() {
        List<Category> allCategories = categoryRepository.findAll();

        // Group children by parentId
        Map<String, List<Category>> childrenMap = new HashMap<>();
        List<Category> rootCategories = new ArrayList<>();

        for (Category cat : allCategories) {
            if (cat.getParentId() == null || cat.getParentId().trim().isEmpty()) {
                rootCategories.add(cat);
            } else {
                childrenMap.computeIfAbsent(cat.getParentId(), k -> new ArrayList<>()).add(cat);
            }
        }

        rootCategories.sort(Comparator.comparingInt(c -> c.getSortOrder() != null ? c.getSortOrder() : 0));

        return rootCategories.stream()
                .map(root -> buildTree(root, childrenMap))
                .collect(Collectors.toList());
    }

    private CategoryTreeResponse buildTree(Category category, Map<String, List<Category>> childrenMap) {
        CategoryTreeResponse node = CategoryTreeResponse.from(category);
        List<Category> children = childrenMap.get(category.getId());
        if (children != null && !children.isEmpty()) {
            children.sort(Comparator.comparingInt(c -> c.getSortOrder() != null ? c.getSortOrder() : 0));
            List<CategoryTreeResponse> childResponses = children.stream()
                    .map(child -> buildTree(child, childrenMap))
                    .collect(Collectors.toList());
            node.setChildren(childResponses);
        }
        return node;
    }

    public CategoryResponse getCategoryById(String id) {
        Category category = findEntityById(id);
        return CategoryResponse.from(category);
    }

    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với slug: " + slug));
        return CategoryResponse.from(category);
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = request.getSlug() != null ? request.getSlug().trim().toLowerCase() : "";
        if (!slug.isEmpty() && categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Danh mục với slug '" + request.getSlug() + "' đã tồn tại");
        }

        if (request.getParentId() != null && !request.getParentId().trim().isEmpty()) {
            if (!categoryRepository.existsById(request.getParentId())) {
                throw new ResourceNotFoundException("Danh mục cha (parentId: " + request.getParentId() + ") không tồn tại");
            }
        }

        Category category = new Category(
                request.getName(),
                slug,
                request.getDescription(),
                normalizeParentId(request.getParentId()),
                request.getSortOrder() != null ? request.getSortOrder() : 0,
                request.getIsActive() != null ? request.getIsActive() : true
        );
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = findEntityById(id);

        if (request.getSlug() != null && !category.getSlug().equalsIgnoreCase(request.getSlug().trim())) {
            String newSlug = request.getSlug().trim().toLowerCase();
            if (categoryRepository.existsBySlug(newSlug)) {
                throw new DuplicateResourceException("Danh mục với slug '" + request.getSlug() + "' đã tồn tại");
            }
            category.setSlug(newSlug);
        }

        String newParentId = normalizeParentId(request.getParentId());
        if (newParentId != null) {
            // Không cho phép tự làm cha của chính nó
            if (id.equals(newParentId)) {
                throw new InvalidCategoryHierarchyException("Danh mục không thể tự làm cha của chính nó");
            }

            // Kiểm tra danh mục cha tồn tại
            if (!categoryRepository.existsById(newParentId)) {
                throw new ResourceNotFoundException("Danh mục cha (parentId: " + newParentId + ") không tồn tại");
            }

            // Kiểm tra vòng lặp cha-con (Cycle detection)
            detectCycle(id, newParentId);
        }

        if (request.getName() != null) {
            category.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        category.setParentId(newParentId);
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        category.setUpdatedAt(Instant.now());

        Category updated = categoryRepository.save(category);
        return CategoryResponse.from(updated);
    }

    public void deleteCategory(String id) {
        findEntityById(id);

        // Kiểm tra danh mục con phụ thuộc
        if (categoryRepository.existsByParentId(id)) {
            throw new ResourceInUseException("Không thể xóa danh mục đang có danh mục con phụ thuộc");
        }

        // Kiểm tra sản phẩm phụ thuộc
        if (productRepository.existsByCategoryId(id)) {
            throw new ResourceInUseException("Không thể xóa danh mục đang được sản phẩm sử dụng");
        }

        categoryRepository.deleteById(id);
    }

    private Category findEntityById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
    }

    private String normalizeParentId(String parentId) {
        return (parentId == null || parentId.trim().isEmpty()) ? null : parentId.trim();
    }

    private void detectCycle(String categoryIdToUpdate, String prospectiveParentId) {
        Set<String> visited = new HashSet<>();
        visited.add(categoryIdToUpdate);

        String currentParentId = prospectiveParentId;
        while (currentParentId != null) {
            if (visited.contains(currentParentId)) {
                throw new InvalidCategoryHierarchyException("Phát hiện vòng lặp phân cấp danh mục! Danh mục cha không thể là hậu duệ của danh mục hiện tại.");
            }
            visited.add(currentParentId);
            Optional<Category> parentOpt = categoryRepository.findById(currentParentId);
            if (parentOpt.isEmpty()) {
                break;
            }
            currentParentId = parentOpt.get().getParentId();
        }
    }
}
