package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.cart.AddToCartRequest;
import com.ecommerce.backend.dto.cart.CartItemResponse;
import com.ecommerce.backend.dto.cart.CartResponse;
import com.ecommerce.backend.dto.cart.UpdateCartItemRequest;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Cart;
import com.ecommerce.backend.model.CartItem;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);
    private static final int MAX_ITEMS_PER_CART = 50;
    private static final int MAX_QUANTITY_PER_ITEM = 10;

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    /**
     * Lấy giỏ hàng của người dùng hiện tại (kèm thông tin chi tiết sản phẩm và giá mới nhất)
     */
    public CartResponse getCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return enrichCart(cart);
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    public CartResponse addToCart(String userId, AddToCartRequest req) {
        if (req.getQuantity() == null || req.getQuantity() < 1 || req.getQuantity() > MAX_QUANTITY_PER_ITEM) {
            throw new BadRequestException("Số lượng mua mỗi sản phẩm phải từ 1 đến " + MAX_QUANTITY_PER_ITEM);
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + req.getProductId()));

        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new BadRequestException("Sản phẩm hiện không còn kinh doanh.");
        }

        int available = product.getInventory() != null ? product.getInventory().getAvailableStock() : 0;
        if (available <= 0) {
            throw new BadRequestException("Sản phẩm tạm thời hết hàng.");
        }

        Cart cart = getOrCreateCart(userId);

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(req.getProductId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQty = existingItem.getQuantity() + req.getQuantity();
            if (newQty > MAX_QUANTITY_PER_ITEM) {
                throw new BadRequestException("Tổng số lượng cho sản phẩm này trong giỏ hàng không được vượt quá " + MAX_QUANTITY_PER_ITEM);
            }
            if (newQty > available) {
                throw new BadRequestException("Tồn kho hiện tại chỉ còn " + available + " sản phẩm.");
            }
            existingItem.setQuantity(newQty);
            existingItem.setUpdatedAt(Instant.now());
        } else {
            if (cart.getItems().size() >= MAX_ITEMS_PER_CART) {
                throw new BadRequestException("Giỏ hàng đã đạt giới hạn tối đa " + MAX_ITEMS_PER_CART + " sản phẩm.");
            }
            if (req.getQuantity() > available) {
                throw new BadRequestException("Tồn kho hiện tại chỉ còn " + available + " sản phẩm.");
            }
            cart.getItems().add(new CartItem(req.getProductId(), req.getQuantity()));
        }

        cart.setUpdatedAt(Instant.now());
        cart = cartRepository.save(cart);
        return enrichCart(cart);
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ hàng
     */
    public CartResponse updateCartItem(String userId, String productId, UpdateCartItemRequest req) {
        if (req.getQuantity() == null || req.getQuantity() < 1 || req.getQuantity() > MAX_QUANTITY_PER_ITEM) {
            throw new BadRequestException("Số lượng mua mỗi sản phẩm phải từ 1 đến " + MAX_QUANTITY_PER_ITEM);
        }

        Cart cart = getOrCreateCart(userId);

        CartItem item = cart.getItems().stream()
                .filter(it -> it.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại trong giỏ hàng: " + productId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));

        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new BadRequestException("Sản phẩm hiện không còn kinh doanh.");
        }

        int available = product.getInventory() != null ? product.getInventory().getAvailableStock() : 0;
        if (req.getQuantity() > available) {
            throw new BadRequestException("Tồn kho khả dụng chỉ còn " + available + " sản phẩm.");
        }

        item.setQuantity(req.getQuantity());
        item.setUpdatedAt(Instant.now());

        cart.setUpdatedAt(Instant.now());
        cart = cartRepository.save(cart);
        return enrichCart(cart);
    }

    /**
     * Xóa 1 sản phẩm khỏi giỏ hàng
     */
    public CartResponse removeCartItem(String userId, String productId) {
        Cart cart = getOrCreateCart(userId);
        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        if (removed) {
            cart.setUpdatedAt(Instant.now());
            cart = cartRepository.save(cart);
        }
        return enrichCart(cart);
    }

    /**
     * Xóa sạch toàn bộ giỏ hàng
     */
    public CartResponse clearCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cart.setUpdatedAt(Instant.now());
        cart = cartRepository.save(cart);
        return enrichCart(cart);
    }

    /**
     * Lấy thực thể Cart của người dùng (sử dụng nội bộ cho Checkout)
     */
    public Cart getCartEntity(String userId) {
        return getOrCreateCart(userId);
    }

    private Cart getOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart(userId);
                    return cartRepository.save(newCart);
                });
    }

    private CartResponse enrichCart(Cart cart) {
        CartResponse response = new CartResponse();
        List<CartItemResponse> enrichedItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (CartItem item : cart.getItems()) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isEmpty()) {
                continue;
            }
            Product product = productOpt.get();

            CartItemResponse itemResp = new CartItemResponse();
            itemResp.setProductId(product.getId());
            itemResp.setSku(product.getSku());
            itemResp.setProductName(product.getName());
            itemResp.setProductSlug(product.getSlug());
            itemResp.setThumbnailUrl(product.getThumbnailUrl());
            itemResp.setUnitPrice(product.getSalePrice());
            itemResp.setListPrice(product.getListPrice());
            itemResp.setQuantity(item.getQuantity());

            BigDecimal itemTotal = product.getSalePrice() != null
                    ? product.getSalePrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                    : BigDecimal.ZERO;
            itemResp.setTotalPrice(itemTotal);

            int available = product.getInventory() != null ? product.getInventory().getAvailableStock() : 0;
            itemResp.setAvailableStock(available);
            itemResp.setInStock(available > 0 && "ACTIVE".equalsIgnoreCase(product.getStatus()));
            itemResp.setAddedAt(item.getAddedAt());

            enrichedItems.add(itemResp);
            subtotal = subtotal.add(itemTotal);
            totalQuantity += item.getQuantity();
        }

        response.setItems(enrichedItems);
        response.setTotalItems(enrichedItems.size());
        response.setTotalQuantity(totalQuantity);
        response.setSubtotal(subtotal);
        return response;
    }
}
