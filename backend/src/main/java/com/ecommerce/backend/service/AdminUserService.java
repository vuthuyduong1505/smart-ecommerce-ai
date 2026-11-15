package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.PageResponse;
import com.ecommerce.backend.dto.user.UserResponse;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PageResponse<UserResponse> getUsers(String keyword, Pageable pageable) {
        Page<User> pageResult;
        if (keyword != null && !keyword.isBlank()) {
            String trimmed = keyword.trim();
            pageResult = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    trimmed, trimmed, pageable
            );
        } else {
            pageResult = userRepository.findAll(pageable);
        }

        List<UserResponse> content = pageResult.getContent().stream()
                .map(UserResponse::fromEntity)
                .toList();

        return new PageResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isLast()
        );
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return UserResponse.fromEntity(user);
    }

    public UserResponse updateUserStatus(String id, String newStatus, String adminUserId) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // Quy tắc bảo vệ: Không cho phép vô hiệu hóa Admin duy nhất còn lại
        if ("ROLE_ADMIN".equalsIgnoreCase(targetUser.getRole()) && !"ACTIVE".equalsIgnoreCase(newStatus)) {
            long adminCount = userRepository.countByRole("ROLE_ADMIN");
            if (adminCount <= 1) {
                throw new BadRequestException("Không thể vô hiệu hóa tài khoản Quản trị viên (Admin) duy nhất của hệ thống.");
            }
        }

        targetUser.setStatus(newStatus.toUpperCase().trim());
        targetUser.setUpdatedAt(Instant.now());

        User updatedUser = userRepository.save(targetUser);
        return UserResponse.fromEntity(updatedUser);
    }
}
