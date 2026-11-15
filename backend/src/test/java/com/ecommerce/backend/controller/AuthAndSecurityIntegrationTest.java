package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.auth.LoginRequest;
import com.ecommerce.backend.dto.auth.RegisterRequest;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthAndSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private User testCustomer;
    private User testAdmin;
    private String customerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        // Xóa người dùng thử nghiệm cũ nếu có
        userRepository.findByEmail("customer.integ@test.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("admin.integ@test.com").ifPresent(userRepository::delete);

        testCustomer = new User();
        testCustomer.setEmail("customer.integ@test.com");
        testCustomer.setFullName("Customer Integration");
        testCustomer.setPasswordHash(passwordEncoder.encode("CustPass@123"));
        testCustomer.setRole("ROLE_CUSTOMER");
        testCustomer.setStatus("ACTIVE");
        testCustomer = userRepository.save(testCustomer);
        customerToken = jwtUtils.generateToken(testCustomer.getId(), testCustomer.getEmail(), testCustomer.getRole());

        testAdmin = new User();
        testAdmin.setEmail("admin.integ@test.com");
        testAdmin.setFullName("Admin Integration");
        testAdmin.setPasswordHash(passwordEncoder.encode("AdminPass@123"));
        testAdmin.setRole("ROLE_ADMIN");
        testAdmin.setStatus("ACTIVE");
        testAdmin = userRepository.save(testAdmin);
        adminToken = jwtUtils.generateToken(testAdmin.getId(), testAdmin.getEmail(), testAdmin.getRole());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Đăng ký tài khoản công khai thành công với role ROLE_CUSTOMER")
    void testRegisterEndpoint() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "New User Integ", "newuser.integ@test.com", "Password@123", "Password@123"
        );
        userRepository.findByEmail("newuser.integ@test.com").ifPresent(userRepository::delete);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser.integ@test.com"))
                .andExpect(jsonPath("$.data.role").value("ROLE_CUSTOMER"));

        // Dọn dẹp
        userRepository.findByEmail("newuser.integ@test.com").ifPresent(userRepository::delete);
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Đăng nhập nhận JWT thành công")
    void testLoginEndpoint() throws Exception {
        LoginRequest req = new LoginRequest("customer.integ@test.com", "CustPass@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("customer.integ@test.com"));
    }

    @Test
    @DisplayName("GET /api/v1/users/me - Trả về 401 Unauthorized khi không gửi JWT")
    void testGetMe_UnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/users/me - Truy cập thành công khi gửi JWT hợp lệ")
    void testGetMe_SuccessWithToken() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("customer.integ@test.com"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - Trả về 403 Forbidden khi role CUSTOMER truy cập Admin endpoint")
    void testAdminUsers_ForbiddenForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users - Truy cập thành công khi có quyền ROLE_ADMIN")
    void testAdminUsers_SuccessForAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
