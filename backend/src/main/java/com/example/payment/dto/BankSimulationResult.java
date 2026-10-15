package com.example.payment.dto;

import com.example.payment.model.PaymentStatus;

public record BankSimulationResult(PaymentStatus status, String bankTransactionId, String message) {
}
