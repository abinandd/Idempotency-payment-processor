package com.example.payment.service;

import com.example.payment.dto.PaymentResponse;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReconciliationService {
    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bank;
    private final DemoStateService demo;
    private final IdempotencyService idempotency;

    public ReconciliationService(PaymentRepository paymentRepository, BankSimulatorService bank,
                                 DemoStateService demo, IdempotencyService idempotency) {
        this.paymentRepository = paymentRepository;
        this.bank = bank;
        this.demo = demo;
        this.idempotency = idempotency;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation.interval:30000}")
    @Transactional
    public void reconcileUnknownPayments() {
        for (Payment payment : paymentRepository.findByStatus(PaymentStatus.UNKNOWN)) {
            String txnId = payment.getBankTransactionId();
            PaymentStatus status = txnId == null ? PaymentStatus.FAILED : bank.getTransactionStatus(txnId);
            if (status == PaymentStatus.UNKNOWN) {
                continue;
            }

            payment.setStatus(status);
            paymentRepository.save(payment);
            demo.recordPaymentOutcome(status);
            demo.recordTimelineMessage("Reconciliation: Payment " + payment.getPaymentId() + " updated to " + status);

            String message = txnId == null ? "Reconciled: No bank transaction, marked FAILED"
                    : "Reconciled from bank: " + status;
            idempotency.updateReconciledState(payment.getIdempotencyKey(), PaymentResponse.from(payment, message));
        }
    }
}
