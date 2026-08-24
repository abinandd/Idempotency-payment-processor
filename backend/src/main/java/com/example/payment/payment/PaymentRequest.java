package com.example.payment.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotNull
    @Positive
    private BigDecimal amount;
    
    @NotBlank
    private String currency;
    
    @NotBlank
    private String customerId;
}