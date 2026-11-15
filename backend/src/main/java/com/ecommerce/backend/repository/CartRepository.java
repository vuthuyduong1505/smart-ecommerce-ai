package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Cart;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends MongoRepository<Cart, String> {

    Optional<Cart> findByUserId(String userId);

    void deleteByUserId(String userId);

    boolean existsByUserId(String userId);
}
