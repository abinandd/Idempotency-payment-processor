package com.example.payment.payment;

import com.example.payment.payment.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class PaymentResponse {
    private String paymentId;
    private PaymentStatus status;
    private BigDecimal amount;
    private String currency;
    private String message;
}