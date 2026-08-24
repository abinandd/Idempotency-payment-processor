package com.example.payment.bank;
import lombok.Data;

@Data
public class BankModeRequest {
    private String mode;
    private Long delayMs;
}