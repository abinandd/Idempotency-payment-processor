package com.example.payment.idempotency;
public class IdempotencyException extends RuntimeException {
    public IdempotencyException(String message) {
        super(message);
    }
}