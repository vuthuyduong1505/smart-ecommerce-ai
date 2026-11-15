package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.auth.AuthResponse;
import com.ecommerce.backend.dto.auth.LoginRequest;
import com.ecommerce.backend.dto.auth.RegisterRequest;
import com.ecommerce.backend.dto.user.UserResponse;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.DuplicateResourceException;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user-123");
        sampleUser.setEmail("test@gmail.com");
        sampleUser.setFullName("Nguyen Van Test");
        sampleUser.setPasswordHash("$2a$12$hashedPassword");
        sampleUser.setRole("ROLE_CUSTOMER");
        sampleUser.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Đăng ký thành công với thông tin hợp lệ")
    void testRegister_Success() {
        RegisterRequest req = new RegisterRequest("Nguyen Van Test", "test@gmail.com", "Password@123", "Password@123");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("$2a$12$hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("test@gmail.com", response.getEmail());
        assertEquals("ROLE_CUSTOMER", response.getRole());
        verify(passwordEncoder).encode("Password@123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi mật khẩu xác nhận không khớp")
    void testRegister_PasswordMismatch() {
        RegisterRequest req = new RegisterRequest("Nguyen Van Test", "test@gmail.com", "Password@123", "DifferentPassword");

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại")
    void testRegister_DuplicateEmail() {
        RegisterRequest req = new RegisterRequest("Nguyen Van Test", "test@gmail.com", "Password@123", "Password@123");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công trả về JWT token và thông tin người dùng")
    void testLogin_Success() {
        LoginRequest req = new LoginRequest("test@gmail.com", "Password@123");

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", "$2a$12$hashedPassword")).thenReturn(true);
        when(jwtUtils.generateToken("user-123", "test@gmail.com", "ROLE_CUSTOMER")).thenReturn("mock-jwt-token");
        when(jwtUtils.getExpirationMs()).thenReturn(86400000L);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        AuthResponse authResponse = authService.login(req);

        assertNotNull(authResponse);
        assertEquals("mock-jwt-token", authResponse.getToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals("test@gmail.com", authResponse.getUser().getEmail());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai mật khẩu")
    void testLogin_WrongPassword() {
        LoginRequest req = new LoginRequest("test@gmail.com", "WrongPassword");

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "$2a$12$hashedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản bị khóa (LOCKED)")
    void testLogin_AccountLocked() {
        sampleUser.setStatus("LOCKED");
        LoginRequest req = new LoginRequest("test@gmail.com", "Password@123");

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", "$2a$12$hashedPassword")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("bị khóa"));
    }
}
