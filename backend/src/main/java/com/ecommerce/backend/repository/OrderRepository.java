package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderStatus;
import com.ecommerce.backend.model.PaymentStatus;
import com.ecommerce.backend.model.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    Optional<Order> findByOrderCode(String orderCode);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(String id, String userId);

    List<Order> findByUserIdAndOrderStatusAndPaymentStatus(
            String userId,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus
    );

    List<Order> findByOrderStatusAndReservationStatusAndExpiresAtBefore(
            OrderStatus orderStatus,
            ReservationStatus reservationStatus,
            Instant cutoff
    );

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByOrderStatusOrderByCreatedAtDesc(OrderStatus orderStatus, Pageable pageable);

    Page<Order> findByOrderCodeContainingIgnoreCaseOrShippingAddressReceiverNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String code, String name, Pageable pageable
    );
}
