package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ApiResponse;
import com.ecommerce.backend.dto.cart.AddToCartRequest;
import com.ecommerce.backend.dto.cart.CartResponse;
import com.ecommerce.backend.dto.cart.UpdateCartItemRequest;
import com.ecommerce.backend.security.CustomUserDetails;
import com.ecommerce.backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CartResponse cart = cartService.getCart(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AddToCartRequest req
    ) {
        CartResponse cart = cartService.addToCart(userDetails.getId(), req);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sản phẩm vào giỏ hàng.", cart));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String productId,
            @Valid @RequestBody UpdateCartItemRequest req
    ) {
        CartResponse cart = cartService.updateCartItem(userDetails.getId(), productId, req);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật số lượng sản phẩm.", cart));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String productId
    ) {
        CartResponse cart = cartService.removeCartItem(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng.", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CartResponse cart = cartService.clearCart(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sạch giỏ hàng.", cart));
    }
}
