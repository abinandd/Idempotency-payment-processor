package com.example.payment;

import com.example.payment.service.BankSimulatorService;
import com.example.payment.controller.PaymentController;
import com.example.payment.dto.PaymentRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class ConcurrencyTest {

    @Autowired
    private PaymentController paymentController;

    @Autowired
    private BankSimulatorService bankSimulatorService;

    @Test
    public void testConcurrentRequests() throws InterruptedException {
        bankSimulatorService.setMode("TIMEOUT", 250L);

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        String idempotencyKey = UUID.randomUUID().toString();

        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("1000.00"));
        request.setCurrency("INR");
        request.setCustomerId("customer-123");

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger conflictCount = new AtomicInteger();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    var response = paymentController.createPayment(idempotencyKey, request);
                    if (response.getStatusCode().value() == 409) {
                        conflictCount.incrementAndGet();
                    } else if (response.getStatusCode().is2xxSuccessful()) {
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertTrue(successCount.get() > 0);
        assertEquals(10, successCount.get() + conflictCount.get());
    }

    @Test
    public void testIdempotentReplayReturnsCachedResponse() {
        bankSimulatorService.setMode("SUCCESS", 0L);
        String idempotencyKey = UUID.randomUUID().toString();

        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("500.00"));
        request.setCurrency("USD");
        request.setCustomerId("customer-replay");

        var firstResponse = paymentController.createPayment(idempotencyKey, request);
        assertEquals(200, firstResponse.getStatusCode().value());
        String firstPaymentId = firstResponse.getBody().getPaymentId();

        // Second request with exact same key and payload
        var secondResponse = paymentController.createPayment(idempotencyKey, request);
        assertEquals(200, secondResponse.getStatusCode().value());
        assertEquals(firstPaymentId, secondResponse.getBody().getPaymentId());
        assertEquals(firstResponse.getBody().getAmount(), secondResponse.getBody().getAmount());
    }

    @Test
    public void testDifferentPayloadWithSameKeyFails() {
        bankSimulatorService.setMode("SUCCESS", 0L);
        String idempotencyKey = UUID.randomUUID().toString();

        PaymentRequest request1 = new PaymentRequest();
        request1.setAmount(new BigDecimal("500.00"));
        request1.setCurrency("USD");
        request1.setCustomerId("customer-mismatch");

        var response1 = paymentController.createPayment(idempotencyKey, request1);
        assertEquals(200, response1.getStatusCode().value());

        // Same key, different amount
        PaymentRequest request2 = new PaymentRequest();
        request2.setAmount(new BigDecimal("999.00"));
        request2.setCurrency("USD");
        request2.setCustomerId("customer-mismatch");

        org.junit.jupiter.api.Assertions.assertThrows(
                com.example.payment.exception.IdempotencyException.class,
                () -> paymentController.createPayment(idempotencyKey, request2)
        );
    }
}
