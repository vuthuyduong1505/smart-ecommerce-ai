package com.ecommerce.backend.exception;

public class InvalidCategoryHierarchyException extends RuntimeException {
    public InvalidCategoryHierarchyException(String message) {
        super(message);
    }
}

