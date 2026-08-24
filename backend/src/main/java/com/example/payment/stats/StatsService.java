package com.example.payment.stats;
import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicLong;
import com.example.payment.stats.DemoStatsResponse;

@Service
public class StatsService {
    private final AtomicLong totalRequests = new AtomicLong();
    private final AtomicLong successfulPayments = new AtomicLong();
    private final AtomicLong duplicateRequests = new AtomicLong();
    private final AtomicLong bankCalls = new AtomicLong();

    public void incrementRequests() { totalRequests.incrementAndGet(); }
    public void incrementSuccessfulPayments() { successfulPayments.incrementAndGet(); }
    public void incrementDuplicateRequests() { duplicateRequests.incrementAndGet(); }
    public void incrementBankCalls() { bankCalls.incrementAndGet(); }
    
    public DemoStatsResponse getStats() {
        DemoStatsResponse res = new DemoStatsResponse();
        res.setTotalRequests(totalRequests.get());
        res.setSuccessfulPayments(successfulPayments.get());
        res.setDuplicateRequests(duplicateRequests.get());
        res.setBankCalls(bankCalls.get());
        return res;
    }
}