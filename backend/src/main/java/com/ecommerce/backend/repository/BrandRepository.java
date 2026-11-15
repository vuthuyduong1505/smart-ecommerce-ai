package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends MongoRepository<Brand, String> {

    Optional<Brand> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    List<Brand> findByIsActiveTrueOrderByNameAsc();

    Page<Brand> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}

