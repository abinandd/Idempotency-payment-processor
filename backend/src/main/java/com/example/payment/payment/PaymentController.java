package com.example.payment.payment;

import com.example.payment.demo.DemoStateService;
import com.example.payment.idempotency.IdempotencyException;
import com.example.payment.idempotency.IdempotencyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin("*")
public class PaymentController {

    private final PaymentService paymentService;
    private final IdempotencyService idempotencyService;
    private final DemoStateService demoStateService;
    private final ObjectMapper objectMapper;

    public PaymentController(
            PaymentService paymentService,
            IdempotencyService idempotencyService,
            DemoStateService demoStateService,
            ObjectMapper objectMapper
    ) {
        this.paymentService = paymentService;
        this.idempotencyService = idempotencyService;
        this.demoStateService = demoStateService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        demoStateService.recordPaymentAttempt();
        String payloadHash = idempotencyService.generatePayloadHash(request);
        boolean acquired = idempotencyService.acquireLock(idempotencyKey, payloadHash);

        if (!acquired) {
            String state = idempotencyService.getState(idempotencyKey);
            if (state == null) {
                throw new IdempotencyException("The idempotency key is already in use");
            }

            if (state.startsWith("PROCESSING:")) {
                String storedHash = state.substring("PROCESSING:".length());
                if (!storedHash.equals(payloadHash)) {
                    throw new IdempotencyException("The idempotency key was already used with a different request payload");
                }
                demoStateService.recordDuplicateRequest();
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(PaymentResponse.builder().message("Processing in progress").build());
            }

            if (state.startsWith("COMPLETED:")) {
                String[] parts = state.substring("COMPLETED:".length()).split(":", 2);
                if (parts.length == 2) {
                    String storedHash = parts[0];
                    if (!storedHash.equals(payloadHash)) {
                        throw new IdempotencyException("The idempotency key was already used with a different request payload");
                    }
                    try {
                        PaymentResponse response = objectMapper.readValue(parts[1], PaymentResponse.class);
                        return ResponseEntity.ok(response);
                    } catch (Exception exception) {
                        throw new RuntimeException("Error parsing idempotency response", exception);
                    }
                }
            }

            throw new IdempotencyException("The idempotency key is already in use");
        }

        PaymentResponse response = paymentService.processNewPayment(request, idempotencyKey);
        idempotencyService.updateState(idempotencyKey, response, payloadHash);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPayment(paymentId));
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String paymentId) {
        return ResponseEntity.ok(java.util.Map.of("status", paymentService.getPayment(paymentId).getStatus()));
    }
}
