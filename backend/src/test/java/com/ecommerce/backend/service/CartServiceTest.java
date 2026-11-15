package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.cart.AddToCartRequest;
import com.ecommerce.backend.dto.cart.CartResponse;
import com.ecommerce.backend.dto.cart.UpdateCartItemRequest;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Cart;
import com.ecommerce.backend.model.CartItem;
import com.ecommerce.backend.model.Inventory;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockProduct = new Product();
        mockProduct.setId("prod-1");
        mockProduct.setSku("DELL-XPS-13");
        mockProduct.setName("Dell XPS 13");
        mockProduct.setSlug("dell-xps-13");
        mockProduct.setSalePrice(new BigDecimal("30000000"));
        mockProduct.setListPrice(new BigDecimal("35000000"));
        mockProduct.setStatus("ACTIVE");
        mockProduct.setInventory(new Inventory(10, 0));
        mockProduct.recalculateInStock();
    }

    @Test
    @DisplayName("Lấy giỏ hàng tạo mới giỏ nếu user chưa có giỏ")
    void getCart_whenCartNotFound_shouldCreateNewCart() {
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponse resp = cartService.getCart("user-1");

        assertThat(resp).isNotNull();
        assertThat(resp.getTotalItems()).isZero();
        assertThat(resp.getSubtotal()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("Thêm sản phẩm hợp lệ vào giỏ hàng thành công")
    void addToCart_validProduct_shouldSuccess() {
        Cart cart = new Cart("user-1");
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        AddToCartRequest req = new AddToCartRequest("prod-1", 2);
        CartResponse resp = cartService.addToCart("user-1", req);

        assertThat(resp.getTotalItems()).isEqualTo(1);
        assertThat(resp.getTotalQuantity()).isEqualTo(2);
        assertThat(resp.getSubtotal()).isEqualByComparingTo(new BigDecimal("60000000"));
        assertThat(resp.getItems().get(0).getProductName()).isEqualTo("Dell XPS 13");
    }

    @Test
    @DisplayName("Thêm sản phẩm đã có trong giỏ sẽ tăng số lượng thay vì tạo item mới")
    void addToCart_existingItem_shouldIncrementQuantity() {
        Cart cart = new Cart("user-1");
        cart.getItems().add(new CartItem("prod-1", 2));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        AddToCartRequest req = new AddToCartRequest("prod-1", 3);
        CartResponse resp = cartService.addToCart("user-1", req);

        assertThat(resp.getTotalItems()).isEqualTo(1);
        assertThat(resp.getTotalQuantity()).isEqualTo(5);
        assertThat(resp.getSubtotal()).isEqualByComparingTo(new BigDecimal("150000000"));
    }

    @Test
    @DisplayName("Thêm sản phẩm vượt quá số lượng tối đa 10 sẽ bị từ chối")
    void addToCart_exceedMaxQuantity_shouldThrowException() {
        Cart cart = new Cart("user-1");
        cart.getItems().add(new CartItem("prod-1", 8));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));

        AddToCartRequest req = new AddToCartRequest("prod-1", 3); // 8 + 3 = 11 > 10

        assertThatThrownBy(() -> cartService.addToCart("user-1", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không được vượt quá 10");
    }

    @Test
    @DisplayName("Thêm sản phẩm hết hàng hoặc vượt tồn kho sẽ bị từ chối")
    void addToCart_insufficientStock_shouldThrowException() {
        mockProduct.getInventory().setQuantity(1); // Chỉ còn 1 sản phẩm
        Cart cart = new Cart("user-1");

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));

        AddToCartRequest req = new AddToCartRequest("prod-1", 2);

        assertThatThrownBy(() -> cartService.addToCart("user-1", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chỉ còn 1");
    }

    @Test
    @DisplayName("Cập nhật số lượng sản phẩm trong giỏ thành công")
    void updateCartItem_valid_shouldSuccess() {
        Cart cart = new Cart("user-1");
        cart.getItems().add(new CartItem("prod-1", 1));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateCartItemRequest req = new UpdateCartItemRequest(4);
        CartResponse resp = cartService.updateCartItem("user-1", "prod-1", req);

        assertThat(resp.getItems().get(0).getQuantity()).isEqualTo(4);
        assertThat(resp.getSubtotal()).isEqualByComparingTo(new BigDecimal("120000000"));
    }

    @Test
    @DisplayName("Xóa sản phẩm khỏi giỏ hàng")
    void removeCartItem_shouldRemoveItem() {
        Cart cart = new Cart("user-1");
        cart.getItems().add(new CartItem("prod-1", 1));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponse resp = cartService.removeCartItem("user-1", "prod-1");

        assertThat(resp.getTotalItems()).isZero();
        assertThat(resp.getItems()).isEmpty();
    }

    @Test
    @DisplayName("Xóa sạch toàn bộ giỏ hàng")
    void clearCart_shouldClearAllItems() {
        Cart cart = new Cart("user-1");
        cart.getItems().add(new CartItem("prod-1", 1));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));

        CartResponse resp = cartService.clearCart("user-1");

        assertThat(resp.getTotalItems()).isZero();
        assertThat(resp.getItems()).isEmpty();
    }
}
