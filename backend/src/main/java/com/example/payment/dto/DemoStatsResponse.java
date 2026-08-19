package com.example.payment.dto;
import lombok.Data;
import java.util.concurrent.atomic.AtomicLong;

@Data
public class DemoStatsResponse {
    private long totalRequests;
    private long successfulPayments;
    private long duplicateRequests;
    private long bankCalls;
}