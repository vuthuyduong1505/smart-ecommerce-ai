package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderItem;
import com.ecommerce.backend.model.OrderStatus;
import com.ecommerce.backend.model.ReservationLog;
import com.ecommerce.backend.model.ReservationStatus;
import com.ecommerce.backend.repository.OrderRepository;
import com.mongodb.client.result.UpdateResult;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Worker quét định kỳ và giải phóng các Reservation đã hết hạn 15 phút.
 * Tự động chạy ngay khi Backend khởi động (@PostConstruct) để bù đắp thời gian server ngừng hoạt động.
 */
@Component
public class ReservationExpirationWorker {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpirationWorker.class);

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final MongoTemplate mongoTemplate;

    public ReservationExpirationWorker(OrderRepository orderRepository,
                                       InventoryService inventoryService,
                                       MongoTemplate mongoTemplate) {
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Chạy ngay khi ứng dụng khởi động để dọn dẹp các đơn hết hạn trong thời gian downtime.
     */
    @PostConstruct
    public void onStartup() {
        log.info("ReservationExpirationWorker initialized. Running initial sweep for expired orders...");
        sweepExpiredReservations();
    }

    /**
     * Quét định kỳ mỗi 60 giây (fixedDelay = 60000ms).
     */
    @Scheduled(fixedDelay = 60000)
    public void scheduledSweep() {
        sweepExpiredReservations();
    }

    public synchronized void sweepExpiredReservations() {
        Instant now = Instant.now();
        List<Order> expiredOrders = orderRepository.findByOrderStatusAndReservationStatusAndExpiresAtBefore(
                OrderStatus.PENDING,
                ReservationStatus.PENDING,
                now
        );

        if (expiredOrders.isEmpty()) {
            return;
        }

        log.info("Found {} orders with expired reservations at {}", expiredOrders.size(), now);

        for (Order order : expiredOrders) {
            processExpiredOrder(order);
        }
    }

    private void processExpiredOrder(Order order) {
        // Cập nhật nguyên tử trạng thái đơn hàng và reservation với điều kiện PENDING
        Query query = new Query(Criteria.where("id").is(order.getId())
                .and("orderStatus").is(OrderStatus.PENDING)
                .and("reservationStatus").is(ReservationStatus.PENDING));

        Update update = new Update()
                .set("orderStatus", OrderStatus.EXPIRED)
                .set("reservationStatus", ReservationStatus.EXPIRED)
                .set("updatedAt", new Date())
                .push("reservationHistory", new ReservationLog(order.getActiveReservationId(), "EXPIRED"));

        UpdateResult result = mongoTemplate.updateFirst(query, update, Order.class);

        // Chỉ giải phóng tồn kho nếu chính worker này cập nhật thành công (Idempotency - chống giải phóng 2 lần)
        if (result.getModifiedCount() > 0) {
            log.info("Order {} transitioned to EXPIRED. Releasing inventory...", order.getOrderCode());
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
            log.info("Released inventory for expired order {}", order.getOrderCode());
        } else {
            log.info("Order {} was already processed by another thread. Skipping release.", order.getOrderCode());
        }
    }
}
