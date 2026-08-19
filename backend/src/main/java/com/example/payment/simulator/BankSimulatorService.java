package com.example.payment.simulator;

import com.example.payment.model.PaymentStatus;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;
import lombok.Data;
import lombok.AllArgsConstructor;

@Service
public class BankSimulatorService {
    private String mode = "SUCCESS";
    private long delayMs = 0;
    
    private final Map<String, PaymentStatus> transactions = new ConcurrentHashMap<>();

    public void setMode(String mode, Long delayMs) {
        this.mode = mode;
        if (delayMs != null) {
            this.delayMs = delayMs;
        }
    }

    public Map<String, Object> getStatus() {
        return Map.of("mode", mode, "delayMs", delayMs);
    }

    public BankResult processPayment(String paymentId) {
        try {
            if (delayMs > 0) Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String currentMode = mode;
        if ("RANDOM".equals(currentMode)) {
            double rand = Math.random();
            if (rand < 0.7) currentMode = "SUCCESS";
            else if (rand < 0.9) currentMode = "FAILURE";
            else currentMode = "TIMEOUT";
        }

        String bankTxId = UUID.randomUUID().toString();

        if ("TIMEOUT".equals(currentMode)) {
            // In a timeout, the bank might or might not have processed it.
            // Let's say it did process it but timed out responding.
            transactions.put(bankTxId, PaymentStatus.SUCCESS);
            return new BankResult(null, PaymentStatus.UNKNOWN);
        } else if ("FAILURE".equals(currentMode)) {
            transactions.put(bankTxId, PaymentStatus.FAILED);
            return new BankResult(bankTxId, PaymentStatus.FAILED);
        } else {
            transactions.put(bankTxId, PaymentStatus.SUCCESS);
            return new BankResult(bankTxId, PaymentStatus.SUCCESS);
        }
    }
    
    public PaymentStatus getTransactionStatus(String bankTxId) {
        return transactions.getOrDefault(bankTxId, PaymentStatus.UNKNOWN);
    }

    @Data
    @AllArgsConstructor
    public static class BankResult {
        private String transactionId;
        private PaymentStatus status;
    }
}