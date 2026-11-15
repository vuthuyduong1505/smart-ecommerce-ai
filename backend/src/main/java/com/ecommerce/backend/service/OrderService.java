package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.order.CheckoutRequest;
import com.ecommerce.backend.dto.order.OrderItemResponse;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.UpdateOrderStatusRequest;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final int RESERVATION_HOLD_MINUTES = 15;

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final CartService cartService;

    public OrderService(OrderRepository orderRepository,
                        CartRepository cartRepository,
                        ProductRepository productRepository,
                        InventoryService inventoryService,
                        CartService cartService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.cartService = cartService;
    }

    /**
     * Quy trình Checkout tạo đơn hàng (Mặc định phương thức thanh toán COD).
     */
    public OrderResponse checkout(String userId, CheckoutRequest req) {
        if (req.getShippingAddress() == null
                || isBlank(req.getShippingAddress().getReceiverName())
                || isBlank(req.getShippingAddress().getPhoneNumber())
                || isBlank(req.getShippingAddress().getFullAddress())) {
            throw new BadRequestException("Vui lòng cung cấp đầy đủ thông tin người nhận (Họ tên, SĐT, Địa chỉ).");
        }

        // 1. Kiểm tra Idempotency Key chống đặt đơn trùng lặp
        String idempotencyKey = req.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Order> existingOrderOpt = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existingOrderOpt.isPresent()) {
                log.info("Idempotent checkout hit for key={}", idempotencyKey);
                return mapToOrderResponse(existingOrderOpt.get());
            }
        } else {
            idempotencyKey = "idemp_checkout_" + UUID.randomUUID();
        }

        // 2. Lấy giỏ hàng của người dùng
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của bạn đang trống."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Giỏ hàng của bạn đang trống.");
        }

        // 3. Kiểm tra sản phẩm và tồn kho sơ bộ trước khi giữ hàng
        List<Product> productsToOrder = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new BadRequestException("Sản phẩm trong giỏ không còn tồn tại: " + item.getProductId()));

            if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
                throw new BadRequestException("Sản phẩm " + product.getName() + " hiện không còn kinh doanh.");
            }

            int available = product.getInventory() != null ? product.getInventory().getAvailableStock() : 0;
            if (item.getQuantity() > available) {
                throw new BadRequestException("Sản phẩm '" + product.getName() + "' không đủ tồn kho khả dụng (yêu cầu: "
                        + item.getQuantity() + ", còn lại: " + available + ").");
            }
            productsToOrder.add(product);
        }

        // 4. Thực hiện Atomic Reservation trên từng sản phẩm (15 phút)
        List<CartItem> successfullyReserved = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            boolean reserved = inventoryService.reserveStock(item.getProductId(), item.getQuantity());
            if (!reserved) {
                // Rollback các sản phẩm đã reserve trước đó
                for (CartItem prev : successfullyReserved) {
                    inventoryService.releaseReservation(prev.getProductId(), prev.getQuantity());
                }
                throw new BadRequestException("Không thể giữ hàng do biến động tồn kho tức thời. Vui lòng thử lại.");
            }
            successfullyReserved.add(item);
        }

        // 5. Tạo Historic Snapshot cho Order Items
        try {
            String orderCode = generateOrderCode();
            String reservationId = "res_" + UUID.randomUUID();

            List<OrderItem> orderItems = new ArrayList<>();
            BigDecimal subtotal = BigDecimal.ZERO;

            for (int i = 0; i < cart.getItems().size(); i++) {
                CartItem cartItem = cart.getItems().get(i);
                Product product = productsToOrder.get(i);

                BigDecimal unitPrice = product.getSalePrice();
                OrderItem orderItem = new OrderItem(
                        product.getId(),
                        product.getSku(),
                        product.getName(),
                        product.getThumbnailUrl(),
                        unitPrice,
                        cartItem.getQuantity()
                );
                orderItems.add(orderItem);
                subtotal = subtotal.add(orderItem.getTotalPrice());
            }

            BigDecimal shippingFee = BigDecimal.ZERO; // Chính sách miễn phí vận chuyển
            BigDecimal discountAmount = BigDecimal.ZERO;
            BigDecimal grandTotal = subtotal.add(shippingFee).subtract(discountAmount);

            Order order = new Order();
            order.setOrderCode(orderCode);
            order.setIdempotencyKey(idempotencyKey);
            order.setUserId(userId);
            order.setActiveReservationId(reservationId);
            order.setReservationStatus(ReservationStatus.PENDING);
            order.getReservationHistory().add(new ReservationLog(reservationId, "PENDING"));

            order.setOrderStatus(OrderStatus.PENDING);
            order.setPaymentStatus(PaymentStatus.UNPAID);
            order.setShippingAddress(req.getShippingAddress());
            order.setPayment(new PaymentDetails("COD"));

            order.setItems(orderItems);
            order.setSubtotal(subtotal);
            order.setShippingFee(shippingFee);
            order.setDiscountAmount(discountAmount);
            order.setGrandTotal(grandTotal);
            order.setNotes(req.getNotes());
            order.setExpiresAt(Instant.now().plus(RESERVATION_HOLD_MINUTES, ChronoUnit.MINUTES));

            order = orderRepository.save(order);

            // 6. Xóa giỏ hàng sau khi tạo đơn thành công
            cartService.clearCart(userId);

            log.info("Order created successfully: orderCode={}, grandTotal={}", order.getOrderCode(), grandTotal);
            return mapToOrderResponse(order);

        } catch (Exception ex) {
            log.error("Error creating order, releasing reserved stock", ex);
            for (CartItem item : successfullyReserved) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
            throw new BadRequestException("Lỗi trong quá trình tạo đơn hàng: " + ex.getMessage());
        }
    }

    /**
     * Khách hàng xem danh sách đơn hàng của mình
     */
    public PageResponse<OrderResponse> getMyOrders(String userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<OrderResponse> responses = page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    /**
     * Khách hàng xem chi tiết 1 đơn hàng của mình
     */
    public OrderResponse getMyOrderById(String userId, String orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này."));
        return mapToOrderResponse(order);
    }

    /**
     * Khách hàng hủy đơn hàng (chỉ được hủy khi PENDING hoặc CONFIRMED)
     */
    public OrderResponse cancelMyOrder(String userId, String orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại."));

        if (order.getOrderStatus() != OrderStatus.PENDING && order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Không thể hủy đơn hàng đang được xử lý hoặc giao hàng (Trạng thái: " + order.getOrderStatus() + ").");
        }

        // Xử lý hoàn trả tồn kho và reservation
        releaseOrRestoreOrderStock(order);

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);

        log.info("User {} cancelled order {}", userId, order.getOrderCode());
        return mapToOrderResponse(order);
    }

    /**
     * Quản trị viên lấy danh sách đơn hàng toàn hệ thống
     */
    public PageResponse<OrderResponse> getAdminOrders(String keyword, String statusStr, Pageable pageable) {
        Page<Order> page;
        if (keyword != null && !keyword.trim().isEmpty()) {
            page = orderRepository.findByOrderCodeContainingIgnoreCaseOrShippingAddressReceiverNameContainingIgnoreCaseOrderByCreatedAtDesc(
                    keyword.trim(), keyword.trim(), pageable
            );
        } else if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                OrderStatus status = OrderStatus.valueOf(statusStr.trim().toUpperCase());
                page = orderRepository.findByOrderStatusOrderByCreatedAtDesc(status, pageable);
            } catch (IllegalArgumentException e) {
                page = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
            }
        } else {
            page = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<OrderResponse> responses = page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    /**
     * Quản trị viên xem chi tiết đơn hàng
     */
    public OrderResponse getAdminOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));
        return mapToOrderResponse(order);
    }

    /**
     * Quản trị viên cập nhật trạng thái đơn hàng theo luồng FSM hợp lệ
     */
    public OrderResponse updateAdminOrderStatus(String orderId, UpdateOrderStatusRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        OrderStatus targetStatus;
        try {
            targetStatus = OrderStatus.valueOf(req.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Trạng thái đơn hàng không hợp lệ: " + req.getStatus());
        }

        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == targetStatus) {
            return mapToOrderResponse(order);
        }

        // Validate FSM Transitions
        if (currentStatus == OrderStatus.CANCELLED || currentStatus == OrderStatus.EXPIRED || currentStatus == OrderStatus.DELIVERED) {
            throw new BadRequestException("Đơn hàng đã ở trạng thái kết thúc (" + currentStatus + "), không thể thay đổi.");
        }

        if (targetStatus == OrderStatus.CONFIRMED) {
            if (currentStatus != OrderStatus.PENDING) {
                throw new BadRequestException("Chỉ có thể xác nhận (CONFIRMED) đơn hàng đang ở trạng thái PENDING.");
            }
            // Thao tác 2: Confirm Reservation (giảm quantity và reserved đồng thời)
            if (order.getReservationStatus() == ReservationStatus.PENDING) {
                for (OrderItem item : order.getItems()) {
                    inventoryService.confirmReservation(item.getProductId(), item.getQuantity());
                }
                order.setReservationStatus(ReservationStatus.CONFIRMED);
                order.getReservationHistory().add(new ReservationLog(order.getActiveReservationId(), "CONFIRMED"));
            }
            order.setOrderStatus(OrderStatus.CONFIRMED);

        } else if (targetStatus == OrderStatus.PROCESSING) {
            if (currentStatus != OrderStatus.CONFIRMED) {
                throw new BadRequestException("Chỉ có thể chuyển sang PROCESSING từ đơn hàng đã CONFIRMED.");
            }
            order.setOrderStatus(OrderStatus.PROCESSING);

        } else if (targetStatus == OrderStatus.SHIPPED) {
            if (currentStatus != OrderStatus.PROCESSING && currentStatus != OrderStatus.CONFIRMED) {
                throw new BadRequestException("Chỉ có thể chuyển sang SHIPPED từ đơn hàng CONFIRMED hoặc PROCESSING.");
            }
            order.setOrderStatus(OrderStatus.SHIPPED);

        } else if (targetStatus == OrderStatus.DELIVERED) {
            if (currentStatus != OrderStatus.SHIPPED) {
                throw new BadRequestException("Chỉ có thể chuyển sang DELIVERED từ đơn hàng đang SHIPPED.");
            }
            order.setOrderStatus(OrderStatus.DELIVERED);
            // Với COD, giao hàng thành công đồng nghĩa đã thu tiền
            order.setPaymentStatus(PaymentStatus.PAID);
            if (order.getPayment() != null) {
                order.getPayment().setPaidAt(Instant.now());
            }

        } else if (targetStatus == OrderStatus.CANCELLED) {
            releaseOrRestoreOrderStock(order);
            order.setOrderStatus(OrderStatus.CANCELLED);

        } else {
            throw new BadRequestException("Chuyển trạng thái không hợp lệ: " + currentStatus + " -> " + targetStatus);
        }

        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);
        log.info("Admin updated order {} to status {}", order.getOrderCode(), targetStatus);
        return mapToOrderResponse(order);
    }

    private void releaseOrRestoreOrderStock(Order order) {
        if (order.getReservationStatus() == ReservationStatus.PENDING) {
            // Đơn hàng chưa confirm: giải phóng số lượng đang reserved
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseReservation(item.getProductId(), item.getQuantity());
            }
            order.setReservationStatus(ReservationStatus.RELEASED);
            order.getReservationHistory().add(new ReservationLog(order.getActiveReservationId(), "RELEASED"));
        } else if (order.getReservationStatus() == ReservationStatus.CONFIRMED) {
            // Đơn hàng đã confirm: hoàn trả quantity
            for (OrderItem item : order.getItems()) {
                inventoryService.restoreConfirmedStock(item.getProductId(), item.getQuantity());
            }
        }
    }

    private String generateOrderCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // yyyyMMdd
        String randPart = String.format("%04X", ThreadLocalRandom.current().nextInt(0x10000));
        return "ORD-" + datePart + "-" + randPart;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    public OrderResponse mapToOrderResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderCode(order.getOrderCode());
        resp.setIdempotencyKey(order.getIdempotencyKey());
        resp.setUserId(order.getUserId());
        resp.setActiveReservationId(order.getActiveReservationId());
        resp.setReservationStatus(order.getReservationStatus());
        resp.setOrderStatus(order.getOrderStatus());
        resp.setPaymentStatus(order.getPaymentStatus());
        resp.setShippingAddress(order.getShippingAddress());
        resp.setPayment(order.getPayment());

        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                OrderItemResponse itemResp = new OrderItemResponse();
                itemResp.setProductId(item.getProductId());
                itemResp.setSku(item.getSku());
                itemResp.setProductName(item.getProductName());
                itemResp.setThumbnailUrl(item.getThumbnailUrl());
                itemResp.setUnitPrice(item.getUnitPrice());
                itemResp.setQuantity(item.getQuantity());
                itemResp.setReturnedQuantity(item.getReturnedQuantity());
                itemResp.setRefundedQuantity(item.getRefundedQuantity());
                itemResp.setTotalPrice(item.getTotalPrice());
                itemResponses.add(itemResp);
            }
        }
        resp.setItems(itemResponses);

        resp.setSubtotal(order.getSubtotal());
        resp.setShippingFee(order.getShippingFee());
        resp.setDiscountAmount(order.getDiscountAmount());
        resp.setGrandTotal(order.getGrandTotal());
        resp.setNotes(order.getNotes());
        resp.setExpiresAt(order.getExpiresAt());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setUpdatedAt(order.getUpdatedAt());

        return resp;
    }
}
