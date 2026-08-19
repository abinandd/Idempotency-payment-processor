package com.example.payment.exception;
public class IdempotencyException extends RuntimeException {
    public IdempotencyException(String message) {
        super(message);
    }
}