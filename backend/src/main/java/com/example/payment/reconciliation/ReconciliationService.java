package com.example.payment.reconciliation;

import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import com.example.payment.simulator.BankSimulatorService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReconciliationService {

    private final PaymentRepository paymentRepository;
    private final BankSimulatorService bankSimulatorService;

    public ReconciliationService(PaymentRepository paymentRepository, BankSimulatorService bankSimulatorService) {
        this.paymentRepository = paymentRepository;
        this.bankSimulatorService = bankSimulatorService;
    }

    @Scheduled(fixedDelayString = "${app.reconciliation.interval:30000}")
    @Transactional
    public void reconcileUnknownPayments() {
        List<Payment> unknownPayments = paymentRepository.findByStatus(PaymentStatus.UNKNOWN);
        for (Payment p : unknownPayments) {
            if (p.getBankTransactionId() != null) {
                PaymentStatus finalStatus = bankSimulatorService.getTransactionStatus(p.getBankTransactionId());
                if (finalStatus != PaymentStatus.UNKNOWN) {
                    p.setStatus(finalStatus);
                    paymentRepository.save(p);
                }
            } else {
                // No bank transaction ID means it timed out before bank returned one, so it likely failed or we don't know
                // For simulator purposes, let's mark FAILED
                p.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(p);
            }
        }
    }
}