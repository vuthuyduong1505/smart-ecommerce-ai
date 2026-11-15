package com.ecommerce.backend.config;

import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap-admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap-admin.full-name:Quản Trị Viên Hệ Thống}")
    private String adminFullName;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (bootstrapEnabled && adminEmail != null && !adminEmail.isBlank() && adminPassword != null && !adminPassword.isBlank()) {
            String normalizedEmail = adminEmail.toLowerCase().trim();
            if (!userRepository.existsByEmail(normalizedEmail)) {
                User admin = new User();
                admin.setEmail(normalizedEmail);
                admin.setFullName(adminFullName);
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                admin.setRole("ROLE_ADMIN");
                admin.setStatus("ACTIVE");
                admin.setCreatedAt(Instant.now());
                admin.setUpdatedAt(Instant.now());

                userRepository.save(admin);
                log.info("Khởi tạo tài khoản Quản trị viên (Admin) ban đầu thành công cho email: {}", normalizedEmail);
            }
        }
    }
}
