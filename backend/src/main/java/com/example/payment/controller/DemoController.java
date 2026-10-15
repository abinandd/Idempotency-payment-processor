package com.example.payment.controller;

import com.example.payment.service.BankSimulatorService;
import com.example.payment.service.DemoStateService;
import com.example.payment.service.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class DemoController {
    private final DemoStateService demoStateService;
    private final BankSimulatorService bankSimulatorService;
    private final HealthService healthService;

    public DemoController(
            DemoStateService demoStateService,
            BankSimulatorService bankSimulatorService,
            HealthService healthService
    ) {
        this.demoStateService = demoStateService;
        this.bankSimulatorService = bankSimulatorService;
        this.healthService = healthService;
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
    public ResponseEntity<List<String>> timeline() {
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
        return ResponseEntity.ok(healthService.check());
    }

    @GetMapping("/api/ui/config")
    public ResponseEntity<Map<String, Object>> uiConfig() {
        return ResponseEntity.ok(demoStateService.uiConfig(bankSimulatorService.getCurrentMode()));
    }
}
