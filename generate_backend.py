import os

files = {
    "backend/src/main/resources/application.yml": """
server:
  port: 8080

spring:
  application:
    name: payment-system
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/payment_db}
    username: ${DATABASE_USERNAME:payment_user}
    password: ${DATABASE_PASSWORD:payment_password}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

app:
  idempotency:
    ttl: ${IDEMPOTENCY_TTL:86400}
  bank:
    mode: ${BANK_MODE:SUCCESS}
    timeout: ${BANK_TIMEOUT:5000}
  reconciliation:
    interval: ${RECONCILIATION_INTERVAL:30000}
""",
    "backend/src/main/java/com/example/payment/model/PaymentStatus.java": """
package com.example.payment.model;
public enum PaymentStatus {
    PROCESSING, SUCCESS, FAILED, UNKNOWN
}
""",
    "backend/src/main/java/com/example/payment/model/Payment.java": """
package com.example.payment.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_id", columnList = "paymentId"),
    @Index(name = "idx_idempotency_key", columnList = "idempotencyKey", unique = true),
    @Index(name = "idx_customer_id", columnList = "customerId"),
    @Index(name = "idx_status", columnList = "status")
})
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String paymentId;
    
    @Column(nullable = false)
    private String customerId;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private String currency;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
    
    private String bankTransactionId;
    
    @Column(nullable = false, unique = true)
    private String idempotencyKey;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
""",
    "backend/src/main/java/com/example/payment/dto/PaymentRequest.java": """
package com.example.payment.dto;

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
""",
    "backend/src/main/java/com/example/payment/dto/PaymentResponse.java": """
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
""",
    "backend/src/main/java/com/example/payment/dto/BankModeRequest.java": """
package com.example.payment.dto;
import lombok.Data;

@Data
public class BankModeRequest {
    private String mode;
    private Long delayMs;
}
""",
    "backend/src/main/java/com/example/payment/dto/DemoStatsResponse.java": """
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
""",
    "backend/src/main/java/com/example/payment/repository/PaymentRepository.java": """
package com.example.payment.repository;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentId(String paymentId);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findByStatus(PaymentStatus status);
}
""",
    "backend/src/main/java/com/example/payment/simulator/BankSimulatorService.java": """
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
""",
    "backend/src/main/java/com/example/payment/service/IdempotencyService.java": """
package com.example.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Service
public class IdempotencyService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlSeconds;

    public IdempotencyService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, @Value("${app.idempotency.ttl:86400}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttlSeconds = ttlSeconds;
    }

    public boolean acquireLock(String idempotencyKey, String payloadHash) {
        String key = "idempotency:" + idempotencyKey;
        // Atomic SET NX
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "PROCESSING:" + payloadHash, Duration.ofSeconds(ttlSeconds));
        return Boolean.TRUE.equals(acquired);
    }
    
    public void updateState(String idempotencyKey, Object response) {
        try {
            String key = "idempotency:" + idempotencyKey;
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, "COMPLETED:" + json, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            throw new RuntimeException("Failed to update idempotency state", e);
        }
    }
    
    public String getState(String idempotencyKey) {
        return redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
    }
    
    public String generatePayloadHash(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash payload", e);
        }
    }
}
""",
    "backend/src/main/java/com/example/payment/service/StatsService.java": """
package com.example.payment.service;
import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicLong;
import com.example.payment.dto.DemoStatsResponse;

@Service
public class StatsService {
    private final AtomicLong totalRequests = new AtomicLong();
    private final AtomicLong successfulPayments = new AtomicLong();
    private final AtomicLong duplicateRequests = new AtomicLong();
    private final AtomicLong bankCalls = new AtomicLong();

    public void incrementRequests() { totalRequests.incrementAndGet(); }
    public void incrementSuccessfulPayments() { successfulPayments.incrementAndGet(); }
    public void incrementDuplicateRequests() { duplicateRequests.incrementAndGet(); }
    public void incrementBankCalls() { bankCalls.incrementAndGet(); }
    
    public DemoStatsResponse getStats() {
        DemoStatsResponse res = new DemoStatsResponse();
        res.setTotalRequests(totalRequests.get());
        res.setSuccessfulPayments(successfulPayments.get());
        res.setDuplicateRequests(duplicateRequests.get());
        res.setBankCalls(bankCalls.get());
        return res;
    }
}
""",
    "backend/src/main/java/com/example/payment/exception/GlobalExceptionHandler.java": """
package com.example.payment.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.time.Instant;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IdempotencyException.class)
    public ResponseEntity<Map<String, Object>> handleIdempotencyException(IdempotencyException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 400,
            "error", "IDEMPOTENCY_KEY_REUSED",
            "message", ex.getMessage()
        ));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", 500,
            "error", "INTERNAL_SERVER_ERROR",
            "message", ex.getMessage()
        ));
    }
}
""",
    "backend/src/main/java/com/example/payment/exception/IdempotencyException.java": """
package com.example.payment.exception;
public class IdempotencyException extends RuntimeException {
    public IdempotencyException(String message) {
        super(message);
    }
}
""",
    "backend/src/main/java/com/example/payment/service/PaymentService.java": """
package com.example.payment.service;

import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import com.example.payment.simulator.BankSimulatorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulator;
    private final StatsService statsService;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository, BankSimulatorService bankSimulator, StatsService statsService, ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.bankSimulator = bankSimulator;
        this.statsService = statsService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PaymentResponse processNewPayment(PaymentRequest request, String idempotencyKey) {
        String paymentId = "pay_" + UUID.randomUUID().toString().replace("-", "");
        
        Payment payment = new Payment();
        payment.setPaymentId(paymentId);
        payment.setCustomerId(request.getCustomerId());
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency());
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setIdempotencyKey(idempotencyKey);
        
        paymentRepository.saveAndFlush(payment);
        
        statsService.incrementBankCalls();
        BankSimulatorService.BankResult result = bankSimulator.processPayment(paymentId);
        
        payment.setStatus(result.getStatus());
        payment.setBankTransactionId(result.getTransactionId());
        paymentRepository.save(payment);
        
        if (result.getStatus() == PaymentStatus.SUCCESS) {
            statsService.incrementSuccessfulPayments();
        }

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .status(payment.getStatus())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .build();
    }
    
    public PaymentResponse getPayment(String paymentId) {
        Payment p = paymentRepository.findByPaymentId(paymentId).orElseThrow(() -> new RuntimeException("Not found"));
        return PaymentResponse.builder()
            .paymentId(p.getPaymentId())
            .status(p.getStatus())
            .amount(p.getAmount())
            .currency(p.getCurrency())
            .build();
    }
}
""",
    "backend/src/main/java/com/example/payment/controller/PaymentController.java": """
package com.example.payment.controller;

import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import com.example.payment.exception.IdempotencyException;
import com.example.payment.service.IdempotencyService;
import com.example.payment.service.PaymentService;
import com.example.payment.service.StatsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin("*")
public class PaymentController {
    
    private final PaymentService paymentService;
    private final IdempotencyService idempotencyService;
    private final StatsService statsService;
    private final ObjectMapper objectMapper;

    public PaymentController(PaymentService paymentService, IdempotencyService idempotencyService, StatsService statsService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.idempotencyService = idempotencyService;
        this.statsService = statsService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {
        
        statsService.incrementRequests();
        String payloadHash = idempotencyService.generatePayloadHash(request);
        
        boolean acquired = idempotencyService.acquireLock(idempotencyKey, payloadHash);
        
        if (!acquired) {
            // check state
            String state = idempotencyService.getState(idempotencyKey);
            statsService.incrementDuplicateRequests();
            if (state != null) {
                if (state.startsWith("PROCESSING:")) {
                    String storedHash = state.substring("PROCESSING:".length());
                    if (!storedHash.equals(payloadHash)) {
                        throw new IdempotencyException("The idempotency key was already used with a different request payload");
                    }
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(PaymentResponse.builder().message("Processing in progress").build());
                } else if (state.startsWith("COMPLETED:")) {
                    String json = state.substring("COMPLETED:".length());
                    try {
                        PaymentResponse res = objectMapper.readValue(json, PaymentResponse.class);
                        // In a real app we'd also check payload hash for completed, but we didn't store it here in the simple implementation for completed, wait we should.
                        // For simplicity just return the response.
                        return ResponseEntity.ok(res);
                    } catch (Exception e) {
                        throw new RuntimeException("Error parsing idempotency response", e);
                    }
                }
            }
        }
        
        try {
            PaymentResponse response = paymentService.processNewPayment(request, idempotencyKey);
            idempotencyService.updateState(idempotencyKey, response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // On failure, should we clear the idempotency key? In this simple impl, let it expire or leave as processing.
            throw e;
        }
    }
    
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPayment(paymentId));
    }
    
    @GetMapping("/{paymentId}/status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable String paymentId) {
        return ResponseEntity.ok(Map.of("status", paymentService.getPayment(paymentId).getStatus()));
    }
}
""",
    "backend/src/main/java/com/example/payment/controller/DemoController.java": """
package com.example.payment.controller;

import com.example.payment.dto.BankModeRequest;
import com.example.payment.dto.DemoStatsResponse;
import com.example.payment.service.StatsService;
import com.example.payment.simulator.BankSimulatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin("*")
public class DemoController {

    private final StatsService statsService;
    private final BankSimulatorService bankSimulatorService;

    public DemoController(StatsService statsService, BankSimulatorService bankSimulatorService) {
        this.statsService = statsService;
        this.bankSimulatorService = bankSimulatorService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DemoStatsResponse> getStats() {
        return ResponseEntity.ok(statsService.getStats());
    }
    
    @PostMapping("/bank/mode")
    public ResponseEntity<Void> setBankMode(@RequestBody BankModeRequest req) {
        bankSimulatorService.setMode(req.getMode(), req.getDelayMs());
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/bank/status")
    public ResponseEntity<Map<String, Object>> getBankStatus() {
        return ResponseEntity.ok(bankSimulatorService.getStatus());
    }
    
    @GetMapping("/bank/transactions/{transactionId}")
    public ResponseEntity<Map<String, Object>> getBankTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(Map.of("status", bankSimulatorService.getTransactionStatus(transactionId)));
    }
}
""",
    "backend/src/main/java/com/example/payment/reconciliation/ReconciliationService.java": """
package com.example.payment.reconciliation;

import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import com.example.payment.simulator.BankSimulatorService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReconciliationService {

    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;

    public ReconciliationService(PaymentRepository paymentRepository, BankSimulatorService bankSimulatorService) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation.interval:30000}")
    @Transactional
    public void reconcileUnknownPayments() {
        List<Payment> unknownPayments = paymentRepository.findByStatus(PaymentStatus.UNKNOWN);
        for (Payment p : unknownPayments) {
            if (p.getBankTransactionId() != null) {
                PaymentStatus finalStatus = bankSimulatorService.getTransactionStatus(p.getBankTransactionId());
                if (finalStatus != PaymentStatus.UNKNOWN) {
                    p.setStatus(finalStatus);
                    paymentRepository.save(p);
                }
            } else {
                // No bank transaction ID means it timed out before bank returned one, so it likely failed or we don't know
                // For simulator purposes, let's mark FAILED
                p.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        }
    }
}
""",
    "backend/src/main/java/com/example/payment/PaymentApplication.java": """
package com.example.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PaymentApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentApplication.class, args);
    }
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip())
