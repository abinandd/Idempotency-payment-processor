package com.example.payment.bank;

import com.example.payment.payment.PaymentStatus;

public record BankSimulationResult(PaymentStatus status, String bankTransactionId, String message) {
}
