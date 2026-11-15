package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.order.CheckoutRequest;
import com.ecommerce.backend.dto.order.OrderResponse;
import com.ecommerce.backend.dto.order.UpdateOrderStatusRequest;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private CartService cartService;

    @InjectMocks
    private OrderService orderService;

    private Product mockProduct;
    private Cart mockCart;
    private CheckoutRequest validCheckoutReq;

    @BeforeEach
    void setUp() {
        mockProduct = new Product();
        mockProduct.setId("prod-1");
        mockProduct.setSku("MAC-M3-14");
        mockProduct.setName("MacBook Pro M3");
        mockProduct.setSalePrice(new BigDecimal("40000000"));
        mockProduct.setStatus("ACTIVE");
        mockProduct.setInventory(new Inventory(10, 0));
        mockProduct.recalculateInStock();

        mockCart = new Cart("user-1");
        mockCart.getItems().add(new CartItem("prod-1", 2));

        validCheckoutReq = new CheckoutRequest();
        validCheckoutReq.setShippingAddress(new ShippingAddress("Nguyen Van A", "0987654321", "123 Pho Hue, Ha Noi"));
        validCheckoutReq.setNotes("Giao gio hanh chinh");
    }

    @Test
    @DisplayName("Checkout từ chối khi giỏ hàng rỗng")
    void checkout_emptyCart_shouldThrowException() {
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(new Cart("user-1")));

        assertThatThrownBy(() -> orderService.checkout("user-1", validCheckoutReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Giỏ hàng của bạn đang trống");
    }

    @Test
    @DisplayName("Checkout thành công tạo đơn PENDING và giữ hàng 15 phút")
    void checkout_valid_shouldCreateOrderWithReservation() {
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(mockCart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(inventoryService.reserveStock("prod-1", 2)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId("order-123");
            return o;
        });

        OrderResponse resp = orderService.checkout("user-1", validCheckoutReq);

        assertThat(resp).isNotNull();
        assertThat(resp.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(resp.getPaymentStatus()).isEqualTo(PaymentStatus.UNPAID);
        assertThat(resp.getReservationStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(resp.getGrandTotal()).isEqualByComparingTo(new BigDecimal("80000000"));
        assertThat(resp.getOrderCode()).startsWith("ORD-");
        assertThat(resp.getExpiresAt()).isAfter(Instant.now());

        verify(inventoryService).reserveStock("prod-1", 2);
        verify(cartService).clearCart("user-1");
    }

    @Test
    @DisplayName("Checkout thất bại khi giữ hàng không thành công và phải rollback")
    void checkout_reservationFails_shouldRollbackAndThrow() {
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(mockCart));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(inventoryService.reserveStock("prod-1", 2)).thenReturn(false);

        assertThatThrownBy(() -> orderService.checkout("user-1", validCheckoutReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể giữ hàng do biến động tồn kho");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Khách hàng hủy đơn PENDING giải phóng reservation")
    void cancelMyOrder_whenPending_shouldReleaseReservation() {
        Order order = new Order();
        order.setId("order-1");
        order.setUserId("user-1");
        order.setOrderCode("ORD-20261116-0001");
        order.setOrderStatus(OrderStatus.PENDING);
        order.setReservationStatus(ReservationStatus.PENDING);
        order.setActiveReservationId("res-1");
        order.getItems().add(new OrderItem("prod-1", "MAC-M3", "MacBook", null, new BigDecimal("40000000"), 1));

        when(orderRepository.findByIdAndUserId("order-1", "user-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse resp = orderService.cancelMyOrder("user-1", "order-1");

        assertThat(resp.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(resp.getReservationStatus()).isEqualTo(ReservationStatus.RELEASED);
        verify(inventoryService).releaseReservation("prod-1", 1);
    }

    @Test
    @DisplayName("Admin xác nhận đơn (CONFIRMED) thực hiện confirm reservation tồn kho")
    void updateAdminOrderStatus_confirm_shouldConfirmReservation() {
        Order order = new Order();
        order.setId("order-1");
        order.setOrderStatus(OrderStatus.PENDING);
        order.setReservationStatus(ReservationStatus.PENDING);
        order.setActiveReservationId("res-1");
        order.getItems().add(new OrderItem("prod-1", "MAC-M3", "MacBook", null, new BigDecimal("40000000"), 2));

        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("CONFIRMED");
        OrderResponse resp = orderService.updateAdminOrderStatus("order-1", req);

        assertThat(resp.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(resp.getReservationStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        verify(inventoryService).confirmReservation("prod-1", 2);
    }

    @Test
    @DisplayName("Admin chuyển trạng thái DELIVERED đánh dấu thanh toán PAID")
    void updateAdminOrderStatus_delivered_shouldMarkPaid() {
        Order order = new Order();
        order.setId("order-1");
        order.setOrderStatus(OrderStatus.SHIPPED);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setPayment(new PaymentDetails("COD"));

        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("DELIVERED");
        OrderResponse resp = orderService.updateAdminOrderStatus("order-1", req);

        assertThat(resp.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(resp.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(resp.getPayment().getPaidAt()).isNotNull();
    }

    @Test
    @DisplayName("Admin chuyển trạng thái sai quy trình FSM bị từ chối")
    void updateAdminOrderStatus_invalidTransition_shouldThrow() {
        Order order = new Order();
        order.setId("order-1");
        order.setOrderStatus(OrderStatus.PENDING);

        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("DELIVERED"); // PENDING -> DELIVERED là sai

        assertThatThrownBy(() -> orderService.updateAdminOrderStatus("order-1", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Chỉ có thể chuyển sang DELIVERED từ đơn hàng đang SHIPPED");
    }
}
