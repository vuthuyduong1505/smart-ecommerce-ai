package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                "smart-ecommerce-backend",
                "0.0.1-SNAPSHOT",
                Instant.now()
        );
        return ResponseEntity.ok(response);
    }
}

