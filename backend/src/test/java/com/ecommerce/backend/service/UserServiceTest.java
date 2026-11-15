package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.user.ChangePasswordRequest;
import com.ecommerce.backend.dto.user.UpdateProfileRequest;
import com.ecommerce.backend.dto.user.UserResponse;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user-123");
        sampleUser.setEmail("user@example.com");
        sampleUser.setFullName("Nguyen Van A");
        sampleUser.setPhoneNumber("0987654321");
        sampleUser.setPasswordHash("$2a$12$currentHashedPassword");
        sampleUser.setRole("ROLE_CUSTOMER");
        sampleUser.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Lấy thông tin người dùng theo ID thành công")
    void testGetUserById_Success() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));

        UserResponse response = userService.getUserById("user-123");

        assertNotNull(response);
        assertEquals("user@example.com", response.getEmail());
        assertEquals("Nguyen Van A", response.getFullName());
    }

    @Test
    @DisplayName("Lấy thông tin thất bại khi không tìm thấy ID")
    void testGetUserById_NotFound() {
        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById("unknown-id"));
    }

    @Test
    @DisplayName("Cập nhật họ tên và số điện thoại thành công")
    void testUpdateProfile_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest("Nguyen Van B", "0912345678");

        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse response = userService.updateProfile("user-123", request);

        assertNotNull(response);
        assertEquals("Nguyen Van B", sampleUser.getFullName());
        assertEquals("0912345678", sampleUser.getPhoneNumber());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công khi nhập đúng mật khẩu cũ")
    void testChangePassword_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPass@123", "NewPass@456", "NewPass@456"
        );

        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPass@123", "$2a$12$currentHashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("NewPass@456")).thenReturn("$2a$12$newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        assertDoesNotThrow(() -> userService.changePassword("user-123", request));

        verify(passwordEncoder).encode("NewPass@456");
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu hiện tại không đúng")
    void testChangePassword_WrongCurrentPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "WrongOldPass", "NewPass@456", "NewPass@456"
        );

        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongOldPass", "$2a$12$currentHashedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> userService.changePassword("user-123", request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu cũ")
    void testChangePassword_SameAsOldPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPass@123", "OldPass@123", "OldPass@123"
        );

        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPass@123", "$2a$12$currentHashedPassword")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> userService.changePassword("user-123", request));
        verify(userRepository, never()).save(any());
    }
}
