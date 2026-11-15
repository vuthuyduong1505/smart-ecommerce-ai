package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.UpdateOrderStatusRequest;
import com.ecommerce.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAdminOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> orders = orderService.getAdminOrders(keyword, status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getAdminOrderById(
            @PathVariable String id
    ) {
        OrderResponse order = orderService.getAdminOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateAdminOrderStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        OrderResponse order = orderService.updateAdminOrderStatus(id, req);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái đơn hàng.", order));
    }
}
