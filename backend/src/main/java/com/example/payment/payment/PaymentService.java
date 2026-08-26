package com.example.payment.payment;

import com.example.payment.bank.BankSimulationResult;
import com.example.payment.bank.BankSimulatorService;
import com.example.payment.demo.DemoStateService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;
    private final DemoStateService demoStateService;

    public PaymentService(
            PaymentRepository paymentRepository,
            BankSimulatorService bankSimulatorService,
            DemoStateService demoStateService
    ) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
        this.demoStateService = demoStateService;
    }

    @Transactional
    public PaymentResponse processNewPayment(PaymentRequest request, String idempotencyKey) {
        String paymentId = "pay_" + UUID.randomUUID().toString().replace("-", "");

        Payment payment = new Payment();
        payment.setPaymentId(paymentId);
        payment.setCustomerId(request.getCustomerId());
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency().toUpperCase());
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setIdempotencyKey(idempotencyKey);

        paymentRepository.saveAndFlush(payment);
        demoStateService.recordBankCall();

        BankSimulationResult bankResult = bankSimulatorService.processPayment(request);
        payment.setBankTransactionId(bankResult.bankTransactionId());
        payment.setStatus(bankResult.status());
        paymentRepository.save(payment);
        demoStateService.recordPaymentOutcome(bankResult.status());

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .message(bankResult.message())
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
