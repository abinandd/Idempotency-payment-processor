package com.example.payment.service;

import com.example.payment.dto.BankSimulationResult;
import com.example.payment.dto.IdempotentPaymentResult;
import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static com.example.payment.service.IdempotencyService.COMPLETED_PREFIX;
import static com.example.payment.service.IdempotencyService.PROCESSING_PREFIX;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;
    private final IdempotencyService idempotencyService;
    private final DemoStateService demoStateService;
    private final TransactionTemplate transactionTemplate;

    public PaymentService(
            PaymentRepository paymentRepository,
            BankSimulatorService bankSimulatorService,
            IdempotencyService idempotencyService,
            DemoStateService demoStateService,
            PlatformTransactionManager transactionManager
    ) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
        this.idempotencyService = idempotencyService;
        this.demoStateService = demoStateService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public IdempotentPaymentResult createPayment(String idempotencyKey, PaymentRequest request) {
        demoStateService.recordPaymentAttempt();
        String payloadHash = idempotencyService.generatePayloadHash(request);

        if (!idempotencyService.acquireLock(idempotencyKey, payloadHash)) {
            return handleDuplicate(idempotencyKey, payloadHash);
        }

        PaymentResponse response;
        try {
            response = processNewPayment(request, idempotencyKey);
        } catch (RuntimeException ex) {
            // nothing reached a final state; free the key so the client can safely retry
            idempotencyService.releaseLock(idempotencyKey);
            throw ex;
        }
        idempotencyService.updateState(idempotencyKey, response, payloadHash);
        return new IdempotentPaymentResult(response, false);
    }

    public PaymentResponse getPayment(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return PaymentResponse.from(payment, null);
    }

    private IdempotentPaymentResult handleDuplicate(String idempotencyKey, String payloadHash) {
        String state = idempotencyService.getState(idempotencyKey);
        if (state == null) {
            throw idempotencyService.keyInUse();
        }

        if (state.startsWith(PROCESSING_PREFIX)) {
            if (!state.substring(PROCESSING_PREFIX.length()).equals(payloadHash)) {
                throw idempotencyService.payloadMismatch();
            }
            demoStateService.recordDuplicateRequest();
            return new IdempotentPaymentResult(
                    PaymentResponse.builder().message("Processing in progress").build(), true);
        }

        if (state.startsWith(COMPLETED_PREFIX)) {
            String[] parts = state.substring(COMPLETED_PREFIX.length()).split(":", 2);
            if (parts.length == 2) {
                if (!parts[0].equals(payloadHash)) {
                    throw idempotencyService.payloadMismatch();
                }
                demoStateService.recordDuplicateRequest();
                demoStateService.recordTimelineMessage("Idempotent replay: cached response returned");
                return new IdempotentPaymentResult(
                        idempotencyService.parseResponse(parts[1], PaymentResponse.class), false);
            }
        }

        throw idempotencyService.keyInUse();
    }

    private PaymentResponse processNewPayment(PaymentRequest request, String idempotencyKey) {
        String paymentId = "pay_" + UUID.randomUUID().toString().replace("-", "");
        String currency = request.getCurrency().toUpperCase();

        // 1. Persist PROCESSING state in a short transaction
        transactionTemplate.executeWithoutResult(tx -> {
            Payment payment = new Payment();
            payment.setPaymentId(paymentId);
            payment.setCustomerId(request.getCustomerId());
            payment.setAmount(request.getAmount());
            payment.setCurrency(currency);
            payment.setStatus(PaymentStatus.PROCESSING);
            payment.setIdempotencyKey(idempotencyKey);
            paymentRepository.save(payment);
        });

        demoStateService.recordBankCall();

        // 2. Call the bank outside any DB transaction so no connection is held
        BankSimulationResult bankResult;
        try {
            bankResult = bankSimulatorService.processPayment();
        } catch (Exception ex) {
            bankResult = new BankSimulationResult(PaymentStatus.FAILED, null,
                    "Bank communication failure: " + ex.getMessage());
        }
        final BankSimulationResult result = bankResult;

        // 3. Record the outcome in a separate short transaction
        transactionTemplate.executeWithoutResult(tx ->
                paymentRepository.findByPaymentId(paymentId).ifPresent(payment -> {
                    payment.setBankTransactionId(result.bankTransactionId());
                    payment.setStatus(result.status());
                    paymentRepository.save(payment);
                }));

        demoStateService.recordPaymentOutcome(result.status());

        return PaymentResponse.builder()
                .paymentId(paymentId)
                .status(result.status())
                .amount(request.getAmount())
                .currency(currency)
                .message(result.message())
                .build();
    }
}
