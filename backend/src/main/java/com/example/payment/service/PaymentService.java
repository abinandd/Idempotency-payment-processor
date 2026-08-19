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