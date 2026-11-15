package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.order.CheckoutRequest;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.security.CustomUserDetails;
import com.ecommerce.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CheckoutRequest req
    ) {
        OrderResponse order = orderService.checkout(userDetails.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công! Đơn hàng đang được xử lý.", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> orders = orderService.getMyOrders(userDetails.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id
    ) {
        OrderResponse order = orderService.getMyOrderById(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelMyOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id
    ) {
        OrderResponse order = orderService.cancelMyOrder(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đơn hàng thành công.", order));
    }
}
