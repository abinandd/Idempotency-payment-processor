package com.example.payment.repository;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentId(String paymentId);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findByStatus(PaymentStatus status);
}