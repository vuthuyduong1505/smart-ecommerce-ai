package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.ProductReview;
import com.ecommerce.backend.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<ProductReview, String> {

    Page<ProductReview> findByProductIdAndStatus(String productId, ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByProductIdAndStatusAndRating(String productId, ReviewStatus status, Integer rating, Pageable pageable);

    List<ProductReview> findByProductIdAndStatus(String productId, ReviewStatus status);

    Page<ProductReview> findByUserIdAndStatusNotOrderByCreatedAtDesc(String userId, ReviewStatus status, Pageable pageable);

    Optional<ProductReview> findByIdAndUserIdAndStatusNot(String id, String userId, ReviewStatus status);

    Optional<ProductReview> findByUserIdAndProductIdAndStatusIn(String userId, String productId, Collection<ReviewStatus> statuses);

    Page<ProductReview> findByStatusOrderByCreatedAtDesc(ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByRatingOrderByCreatedAtDesc(Integer rating, Pageable pageable);

    Page<ProductReview> findByStatusAndRatingOrderByCreatedAtDesc(ReviewStatus status, Integer rating, Pageable pageable);

    Page<ProductReview> findByProductNameContainingIgnoreCaseOrUserFullNameContainingIgnoreCaseOrTitleContainingIgnoreCaseOrderByCreatedAtDesc(
            String prod, String user, String title, Pageable pageable
    );
}
