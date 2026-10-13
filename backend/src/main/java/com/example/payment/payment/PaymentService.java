package com.example.payment.payment;

import com.example.payment.bank.BankSimulationResult;
import com.example.payment.bank.BankSimulatorService;
import com.example.payment.demo.DemoStateService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;
    private final DemoStateService demoStateService;
    private final TransactionTemplate transactionTemplate;

    public PaymentService(
            PaymentRepository paymentRepository,
            BankSimulatorService bankSimulatorService,
            DemoStateService demoStateService,
            PlatformTransactionManager transactionManager
    ) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
        this.demoStateService = demoStateService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public PaymentResponse processNewPayment(PaymentRequest request, String idempotencyKey) {
        String paymentId = "pay_" + UUID.randomUUID().toString().replace("-", "");

        // 1. Save initial PROCESSING state in a short transaction
        transactionTemplate.executeWithoutResult(status -> {
            Payment payment = new Payment();
            payment.setPaymentId(paymentId);
            payment.setCustomerId(request.getCustomerId());
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency().toUpperCase());
            payment.setStatus(PaymentStatus.PROCESSING);
            payment.setIdempotencyKey(idempotencyKey);
            paymentRepository.save(payment);
        });

        demoStateService.recordBankCall();

        // 2. Call external provider outside DB transaction boundary (DB connection is free)
        BankSimulationResult bankResult;
        try {
            bankResult = bankSimulatorService.processPayment(request);
        } catch (Exception ex) {
            bankResult = new BankSimulationResult(PaymentStatus.FAILED, null, "Bank communication failure: " + ex.getMessage());
        }

        final BankSimulationResult finalResult = bankResult;

        // 3. Update outcome in a separate short transaction
        transactionTemplate.executeWithoutResult(status -> {
            paymentRepository.findByPaymentId(paymentId).ifPresent(p -> {
                p.setBankTransactionId(finalResult.bankTransactionId());
                p.setStatus(finalResult.status());
                paymentRepository.save(p);
            });
        });

        demoStateService.recordPaymentOutcome(finalResult.status());

        return PaymentResponse.builder()
                .paymentId(paymentId)
                .status(finalResult.status())
                .amount(request.getAmount())
                .currency(request.getCurrency().toUpperCase())
                .message(finalResult.message())
                .build();
    }

    public PaymentResponse getPayment(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .build();
    }
}
