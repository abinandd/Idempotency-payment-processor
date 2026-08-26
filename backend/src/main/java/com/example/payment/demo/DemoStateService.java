package com.example.payment.demo;

import com.example.payment.bank.BankMode;
import com.example.payment.payment.PaymentStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DemoStateService {
    private final AtomicLong totalRequests = new AtomicLong();
    private final AtomicLong bankCalls = new AtomicLong();
    private final AtomicLong successfulPayments = new AtomicLong();
    private final AtomicLong duplicateRequests = new AtomicLong();
    private final ConcurrentLinkedDeque<String> timeline = new ConcurrentLinkedDeque<>();

    public void recordPaymentAttempt() {
        totalRequests.incrementAndGet();
        addTimeline("Payment request received");
    }

    public void recordBankCall() {
        bankCalls.incrementAndGet();
        addTimeline("Bank simulator called");
    }

    public void recordPaymentOutcome(PaymentStatus status) {
        if (status == PaymentStatus.SUCCESS) {
            successfulPayments.incrementAndGet();
            addTimeline("Payment completed successfully");
        } else if (status == PaymentStatus.FAILED) {
            addTimeline("Payment failed at bank");
        } else if (status == PaymentStatus.UNKNOWN) {
            addTimeline("Payment pending reconciliation");
        }
    }

    public void recordDuplicateRequest() {
        duplicateRequests.incrementAndGet();
        addTimeline("Duplicate request blocked by idempotency");
    }

    public void recordTimelineMessage(String message) {
        addTimeline(message);
    }

    public Map<String, Long> snapshotStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalRequests", totalRequests.get());
        stats.put("bankCalls", bankCalls.get());
        stats.put("successfulPayments", successfulPayments.get());
        stats.put("duplicateRequests", duplicateRequests.get());
        return stats;
    }

    public List<String> snapshotTimeline() {
        return new ArrayList<>(timeline);
    }

    public Map<String, Object> uiConfig(BankMode bankMode) {
        return Map.of(
                "sidebarNavItems", List.of(
                        Map.of("id", "lab", "label", "Idempotency Lab", "icon", "zap", "description", "Fire concurrent duplicate requests"),
                        Map.of("id", "bank", "label", "Bank Simulator", "icon", "landmark", "description", "Switch provider behaviour instantly")
                ),
                "pageCopy", Map.of(
                        "badge", bankMode.name(),
                        "title", "Idempotency Lab",
                        "subtitle", "Simulate payment requests, duplicate protection, and bank outcomes"
                ),
                "statCards", List.of(
                        Map.of("id", "totalRequests", "label", "Total Requests", "icon", "activity", "iconClass", "text-muted", "cardClass", ""),
                        Map.of("id", "bankCalls", "label", "Actual Bank Calls", "icon", "landmark", "iconClass", "text-muted", "cardClass", ""),
                        Map.of("id", "successfulPayments", "label", "Successful Payments", "icon", "check-circle", "iconClass", "text-success", "cardClass", "success-card"),
                        Map.of("id", "duplicateRequests", "label", "Duplicates Blocked", "icon", "shield", "iconClass", "text-accent", "cardClass", "safe-card")
                )
        );
    }

    private void addTimeline(String message) {
        timeline.addFirst(Instant.now() + " - " + message);
        while (timeline.size() > 50) {
            timeline.removeLast();
        }
    }
}
