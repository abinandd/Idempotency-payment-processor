package com.example.payment.demo;

import com.example.payment.bank.BankSimulatorService;
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

    public DemoController(DemoStateService demoStateService, BankSimulatorService bankSimulatorService) {
        this.demoStateService = demoStateService;
        this.bankSimulatorService = bankSimulatorService;
    }

    @GetMapping("/api/demo/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(demoStateService.snapshotStats());
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
        return ResponseEntity.ok(Map.of(
                "api", "Online",
                "redis", "Connected",
                "postgres", "Connected"
        ));
    }

    @GetMapping("/api/ui/config")
    public ResponseEntity<Map<String, Object>> uiConfig() {
        return ResponseEntity.ok(demoStateService.uiConfig(bankSimulatorService.getCurrentMode()));
    }
}
