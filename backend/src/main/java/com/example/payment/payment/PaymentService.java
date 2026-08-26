package com.example.payment.payment;

import com.example.payment.payment.PaymentRequest;
import com.example.payment.payment.PaymentResponse;
import com.example.payment.payment.Payment;
import com.example.payment.payment.PaymentStatus;
import com.example.payment.payment.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository, ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
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
        
        // Simulating a real call to a Payment Gateway (e.g. Stripe/Razorpay)
        // In a realistic app, you'd make an HTTP call here and handle the response.
        String gatewayTransactionId = "txn_" + UUID.randomUUID().toString();
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setBankTransactionId(gatewayTransactionId);
        paymentRepository.save(payment);
        
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