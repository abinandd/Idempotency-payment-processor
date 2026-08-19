package com.example.payment.dto;
import lombok.Data;

@Data
public class BankModeRequest {
    private String mode;
    private Long delayMs;
}