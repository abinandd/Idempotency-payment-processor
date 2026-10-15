package com.example.payment.service;

import com.example.payment.dto.BankSimulationResult;
import com.example.payment.model.BankMode;
import com.example.payment.model.PaymentStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class BankSimulatorService {
    private final AtomicReference<BankMode> currentMode;
    private final AtomicReference<Duration> timeoutDuration;
    private final Map<String, TransactionRecord> transactions = new ConcurrentHashMap<>();

    public BankSimulatorService(
            @Value("${app.bank.mode:SUCCESS}") String initialMode,
            @Value("${app.bank.timeout:5000}") long timeoutMs
    ) {
        this.currentMode = new AtomicReference<>(parseMode(initialMode));
        this.timeoutDuration = new AtomicReference<>(Duration.ofMillis(timeoutMs));
    }

    public BankMode getCurrentMode() {
        return currentMode.get();
    }

    public Duration getTimeoutDuration() {
        return timeoutDuration.get();
    }

    public BankMode setMode(String modeName, Long delayMs) {
        BankMode mode = parseMode(modeName);
        currentMode.set(mode);
        if (delayMs != null && delayMs > 0) {
            timeoutDuration.set(Duration.ofMillis(delayMs));
        }
        return mode;
    }

    public BankSimulationResult processPayment() {
        String transactionId = "txn_" + UUID.randomUUID().toString().replace("-", "");

        return switch (currentMode.get()) {
            case SUCCESS -> {
                transactions.put(transactionId, new TransactionRecord(PaymentStatus.SUCCESS, Instant.now()));
                yield new BankSimulationResult(PaymentStatus.SUCCESS, transactionId, "Payment approved");
            }
            case FAILURE -> {
                transactions.put(transactionId, new TransactionRecord(PaymentStatus.FAILED, Instant.now()));
                yield new BankSimulationResult(PaymentStatus.FAILED, transactionId, "Payment rejected by bank");
            }
            case TIMEOUT -> {
                Duration timeout = timeoutDuration.get();
                sleep(timeout);
                transactions.put(transactionId, new TransactionRecord(PaymentStatus.SUCCESS, Instant.now().plus(timeout)));
                yield new BankSimulationResult(PaymentStatus.UNKNOWN, transactionId, "Bank response timed out");
            }
        };
    }

    public PaymentStatus getTransactionStatus(String transactionId) {
        TransactionRecord record = transactions.get(transactionId);
        if (record == null || Instant.now().isBefore(record.availableAt())) {
            return PaymentStatus.UNKNOWN;
        }
        return record.finalStatus();
    }

    private void sleep(Duration duration) {
        try {
            Thread.sleep(Math.max(0L, duration.toMillis()));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private BankMode parseMode(String modeName) {
        try {
            return BankMode.valueOf(modeName.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return BankMode.SUCCESS;
        }
    }

    private record TransactionRecord(PaymentStatus finalStatus, Instant availableAt) {
    }
}
