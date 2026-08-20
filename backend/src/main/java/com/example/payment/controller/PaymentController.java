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
                    String[] parts = state.substring("COMPLETED:".length()).split(":", 2);
                    if (parts.length == 2) {
                        String storedHash = parts[0];
                        if (!storedHash.equals(payloadHash)) {
                            throw new IdempotencyException("The idempotency key was already used with a different request payload");
                        }
                        try {
                            PaymentResponse res = objectMapper.readValue(parts[1], PaymentResponse.class);
                            return ResponseEntity.ok(res);
                        } catch (Exception e) {
                            throw new RuntimeException("Error parsing idempotency response", e);
                        }
                    }
                }
            }
        }
        
        try {
            PaymentResponse response = paymentService.processNewPayment(request, idempotencyKey);
            idempotencyService.updateState(idempotencyKey, response, payloadHash);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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