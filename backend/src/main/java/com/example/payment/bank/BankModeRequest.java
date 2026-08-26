package com.example.payment.bank;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BankModeRequest {
    @NotBlank
    private String mode;

    private Long delayMs;
}
