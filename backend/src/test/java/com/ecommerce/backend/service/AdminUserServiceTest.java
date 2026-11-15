package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.user.UserResponse;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    @DisplayName("Lấy danh sách người dùng có phân trang cho Admin")
    void testGetUsers_Success() {
        User u1 = new User("user1@gmail.com", "hash", "User One", "ROLE_CUSTOMER", "ACTIVE");
        u1.setId("id-1");
        User u2 = new User("admin@gmail.com", "hash", "Admin User", "ROLE_ADMIN", "ACTIVE");
        u2.setId("id-2");

        when(userRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(u1, u2), PageRequest.of(0, 10), 2));

        PageResponse<UserResponse> result = adminUserService.getUsers(null, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        assertEquals(2, result.getContent().size());
    }

    @Test
    @DisplayName("Admin cập nhật trạng thái người dùng thành công")
    void testUpdateUserStatus_Success() {
        User target = new User("user@gmail.com", "hash", "User Name", "ROLE_CUSTOMER", "ACTIVE");
        target.setId("target-id");

        when(userRepository.findById("target-id")).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenReturn(target);

        UserResponse res = adminUserService.updateUserStatus("target-id", "LOCKED", "admin-id");

        assertNotNull(res);
        assertEquals("LOCKED", target.getStatus());
        verify(userRepository).save(target);
    }

    @Test
    @DisplayName("Bảo vệ Admin cuối cùng: Không cho phép vô hiệu hóa Admin duy nhất còn lại")
    void testUpdateUserStatus_ProtectLastAdmin() {
        User adminUser = new User("admin@gmail.com", "hash", "Admin Name", "ROLE_ADMIN", "ACTIVE");
        adminUser.setId("admin-id");

        when(userRepository.findById("admin-id")).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRole("ROLE_ADMIN")).thenReturn(1L);

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> adminUserService.updateUserStatus("admin-id", "LOCKED", "admin-id")
        );

        assertTrue(ex.getMessage().contains("Quản trị viên (Admin) duy nhất"));
        verify(userRepository, never()).save(any());
    }
}
