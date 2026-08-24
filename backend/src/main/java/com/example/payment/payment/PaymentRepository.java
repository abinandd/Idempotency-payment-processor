package com.example.payment.payment;
import com.example.payment.payment.Payment;
import com.example.payment.payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentId(String paymentId);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findByStatus(PaymentStatus status);
}