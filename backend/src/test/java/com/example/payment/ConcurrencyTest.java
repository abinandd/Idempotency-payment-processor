package com.example.payment;

import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ConcurrencyTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void testConcurrentRequests() throws InterruptedException {
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        
        String idempotencyKey = UUID.randomUUID().toString();
        
        PaymentRequest req = new PaymentRequest();
        req.setAmount(new BigDecimal("1000.00"));
        req.setCurrency("INR");
        req.setCustomerId("customer-123");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Idempotency-Key", idempotencyKey);
        HttpEntity<PaymentRequest> entity = new HttpEntity<>(req, headers);

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger conflictCount = new AtomicInteger();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    ResponseEntity<PaymentResponse> response = restTemplate.postForEntity("/api/payments", entity, PaymentResponse.class);
                    if (response.getStatusCode().is2xxSuccessful()) {
                        successCount.incrementAndGet();
                    } else if (response.getStatusCode().value() == 409) {
                        conflictCount.incrementAndGet();
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
