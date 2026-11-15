package com.ecommerce.backend.repository;

import com.ecommerce.backend.dto.product.ProductFilterParams;
import com.ecommerce.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Repository
public class ProductRepositoryCustomImpl implements ProductRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public ProductRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Product> findWithFilters(ProductFilterParams filter, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (filter != null) {
            // 1. Keyword search (Name, Tags, shortDescription)
            if (filter.getKeyword() != null && !filter.getKeyword().trim().isEmpty()) {
                String keyword = filter.getKeyword().trim();
                Pattern regex = Pattern.compile(Pattern.quote(keyword), Pattern.CASE_INSENSITIVE);
                Criteria keywordCriteria = new Criteria().orOperator(
                        Criteria.where("name").regex(regex),
                        Criteria.where("tags").regex(regex),
                        Criteria.where("shortDescription").regex(regex),
                        Criteria.where("sku").regex(regex)
                );
                criteriaList.add(keywordCriteria);
            }

            // 2. Category
            if (filter.getCategorySlug() != null && !filter.getCategorySlug().trim().isEmpty()) {
                criteriaList.add(Criteria.where("categorySlug").is(filter.getCategorySlug().trim().toLowerCase()));
            }
            if (filter.getCategoryId() != null && !filter.getCategoryId().trim().isEmpty()) {
                criteriaList.add(Criteria.where("categoryId").is(filter.getCategoryId().trim()));
            }

            // 3. Brand
            if (filter.getBrandName() != null && !filter.getBrandName().trim().isEmpty()) {
                Pattern brandRegex = Pattern.compile("^" + Pattern.quote(filter.getBrandName().trim()) + "$", Pattern.CASE_INSENSITIVE);
                criteriaList.add(Criteria.where("brandName").regex(brandRegex));
            }
            if (filter.getBrandId() != null && !filter.getBrandId().trim().isEmpty()) {
                criteriaList.add(Criteria.where("brandId").is(filter.getBrandId().trim()));
            }

            // 4. Price range
            if (filter.getMinPrice() != null && filter.getMaxPrice() != null) {
                criteriaList.add(Criteria.where("salePrice").gte(filter.getMinPrice()).lte(filter.getMaxPrice()));
            } else if (filter.getMinPrice() != null) {
                criteriaList.add(Criteria.where("salePrice").gte(filter.getMinPrice()));
            } else if (filter.getMaxPrice() != null) {
                criteriaList.add(Criteria.where("salePrice").lte(filter.getMaxPrice()));
            }

            // 5. Status
            if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()) {
                criteriaList.add(Criteria.where("status").is(filter.getStatus().trim().toUpperCase()));
            }

            // 6. inStock
            if (filter.getInStock() != null) {
                criteriaList.add(Criteria.where("inStock").is(filter.getInStock()));
            }

            // 7. useCase inside attributes.useCases
            if (filter.getUseCase() != null && !filter.getUseCase().trim().isEmpty()) {
                criteriaList.add(Criteria.where("attributes.useCases").is(filter.getUseCase().trim().toUpperCase()));
            }
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Product.class);
        query.with(pageable);
        List<Product> products = mongoTemplate.find(query, Product.class);

        return new PageImpl<>(products, pageable, total);
    }
}

