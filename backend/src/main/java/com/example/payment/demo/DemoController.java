package com.example.payment.demo;

import com.example.payment.bank.BankSimulatorService;
import com.example.payment.payment.PaymentRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping
@CrossOrigin("*")
public class DemoController {
    private final DemoStateService demoStateService;
    private final BankSimulatorService bankSimulatorService;
    private final StringRedisTemplate redisTemplate;
    private final PaymentRepository paymentRepository;

    public DemoController(
            DemoStateService demoStateService,
            BankSimulatorService bankSimulatorService,
            StringRedisTemplate redisTemplate,
            PaymentRepository paymentRepository
    ) {
        this.demoStateService = demoStateService;
        this.bankSimulatorService = bankSimulatorService;
        this.redisTemplate = redisTemplate;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/api/demo/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(demoStateService.snapshotStats());
    }

    @PostMapping("/api/demo/stats/reset")
    public ResponseEntity<Map<String, Object>> resetStats() {
        demoStateService.resetStats();
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Stats reset"));
    }

    @GetMapping("/api/demo/timeline")
    public ResponseEntity<?> timeline() {
        return ResponseEntity.ok(demoStateService.snapshotTimeline());
    }

    @PostMapping("/api/demo/timeline")
    public ResponseEntity<Map<String, Object>> addTimeline(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "Timeline event");
        demoStateService.recordTimelineMessage(message);
        return ResponseEntity.ok(Map.of("status", "ok", "message", message));
    }

    @GetMapping("/api/system/health")
    public ResponseEntity<Map<String, String>> health() {
        String redisHealth = "Connected";
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
        } catch (Exception e) {
            redisHealth = "Disconnected";
        }

        String dbHealth = "Connected";
        try {
            paymentRepository.count();
        } catch (Exception e) {
            dbHealth = "Disconnected";
        }

        return ResponseEntity.ok(Map.of(
                "api", "Online",
                "redis", redisHealth,
                "postgres", dbHealth
        ));
    }

    @GetMapping("/api/ui/config")
    public ResponseEntity<Map<String, Object>> uiConfig() {
        return ResponseEntity.ok(demoStateService.uiConfig(bankSimulatorService.getCurrentMode()));
    }
}
