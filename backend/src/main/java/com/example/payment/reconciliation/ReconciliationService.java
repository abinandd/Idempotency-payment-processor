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

    public ReconciliationService(
            PaymentRepository paymentRepository,
            BankSimulatorService bankSimulatorService,
            DemoStateService demoStateService
    ) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
        this.demoStateService = demoStateService;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation.interval:30000}")
    @Transactional
    public void reconcileUnknownPayments() {
        List<Payment> unknownPayments = paymentRepository.findByStatus(PaymentStatus.UNKNOWN);
        for (Payment payment : unknownPayments) {
            if (payment.getBankTransactionId() != null) {
                PaymentStatus finalStatus = bankSimulatorService.getTransactionStatus(payment.getBankTransactionId());
                if (finalStatus != PaymentStatus.UNKNOWN) {
                    payment.setStatus(finalStatus);
                    paymentRepository.save(payment);
                    demoStateService.recordPaymentOutcome(finalStatus);
                }
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                demoStateService.recordPaymentOutcome(PaymentStatus.FAILED);
            }
        }
    }
}
