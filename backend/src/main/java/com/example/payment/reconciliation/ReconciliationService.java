package com.example.payment.reconciliation;

import com.example.payment.bank.BankSimulatorService;
import com.example.payment.demo.DemoStateService;
import com.example.payment.payment.Payment;
import com.example.payment.payment.PaymentRepository;
import com.example.payment.payment.PaymentStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReconciliationService {

    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;
    private final DemoStateService demoStateService;
    private final com.example.payment.idempotency.IdempotencyService idempotencyService;

    public ReconciliationService(
            PaymentRepository paymentRepository,
            BankSimulatorService bankSimulatorService,
            DemoStateService demoStateService,
            com.example.payment.idempotency.IdempotencyService idempotencyService
    ) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
        this.demoStateService = demoStateService;
        this.idempotencyService = idempotencyService;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation.interval:30000}")
    @Transactional
    public void reconcileUnknownPayments() {
        List<Payment> unknownPayments = paymentRepository.findByStatus(PaymentStatus.UNKNOWN);
        for (Payment payment : unknownPayments) {
            PaymentStatus finalStatus;
            String message;
            if (payment.getBankTransactionId() != null) {
                finalStatus = bankSimulatorService.getTransactionStatus(payment.getBankTransactionId());
                if (finalStatus != PaymentStatus.UNKNOWN) {
                    payment.setStatus(finalStatus);
                    paymentRepository.save(payment);
                    demoStateService.recordPaymentOutcome(finalStatus);
                    message = "Reconciled from bank: " + finalStatus;
                    demoStateService.recordTimelineMessage("Reconciliation: Payment " + payment.getPaymentId() + " updated to " + finalStatus);
                    
                    com.example.payment.payment.PaymentResponse updatedResponse = com.example.payment.payment.PaymentResponse.builder()
                            .paymentId(payment.getPaymentId())
                            .status(finalStatus)
                            .amount(payment.getAmount())
                            .currency(payment.getCurrency())
                            .message(message)
                            .build();
                    idempotencyService.updateReconciledState(payment.getIdempotencyKey(), updatedResponse);
                }
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                demoStateService.recordPaymentOutcome(PaymentStatus.FAILED);
                message = "Reconciled: No bank transaction, marked FAILED";
                demoStateService.recordTimelineMessage("Reconciliation: Payment " + payment.getPaymentId() + " marked FAILED");
                
                com.example.payment.payment.PaymentResponse updatedResponse = com.example.payment.payment.PaymentResponse.builder()
                        .paymentId(payment.getPaymentId())
                        .status(PaymentStatus.FAILED)
                        .amount(payment.getAmount())
                        .currency(payment.getCurrency())
                        .message(message)
                        .build();
                idempotencyService.updateReconciledState(payment.getIdempotencyKey(), updatedResponse);
            }
        }
    }
}
