package com.example.payment;

import com.example.payment.bank.BankSimulatorService;
import com.example.payment.payment.PaymentController;
import com.example.payment.payment.PaymentRequest;
import com.example.payment.payment.PaymentResponse;
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
}
