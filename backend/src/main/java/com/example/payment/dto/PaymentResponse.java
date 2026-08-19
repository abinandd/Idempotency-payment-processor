package com.example.payment.dto;

import com.example.payment.model.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PaymentResponse {
    private String paymentId;
    private PaymentStatus status;
    private BigDecimal amount;
    private String currency;
    private String message;
}