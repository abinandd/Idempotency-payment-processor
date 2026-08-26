package com.example.payment.payment;

import com.example.payment.payment.PaymentRequest;
import com.example.payment.payment.PaymentResponse;
import com.example.payment.idempotency.IdempotencyException;
import com.example.payment.idempotency.IdempotencyService;
import com.example.payment.payment.PaymentService;
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
    private final ObjectMapper objectMapper;

    public PaymentController(PaymentService paymentService, IdempotencyService idempotencyService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {
        
        String payloadHash = idempotencyService.generatePayloadHash(request);
        
        boolean acquired = idempotencyService.acquireLock(idempotencyKey, payloadHash);
        
        if (!acquired) {
            String state = idempotencyService.getState(idempotencyKey);
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