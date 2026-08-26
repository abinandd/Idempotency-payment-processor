package com.example.payment.bank;

import com.example.payment.demo.DemoStateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo/bank")
@CrossOrigin("*")
public class BankSimulatorController {
    private final BankSimulatorService bankSimulatorService;
    private final DemoStateService demoStateService;

    public BankSimulatorController(BankSimulatorService bankSimulatorService, DemoStateService demoStateService) {
        this.bankSimulatorService = bankSimulatorService;
        this.demoStateService = demoStateService;
    }

    @PostMapping("/mode")
    public ResponseEntity<Map<String, Object>> updateMode(@Valid @RequestBody BankModeRequest request) {
        BankMode mode = bankSimulatorService.setMode(request.getMode(), request.getDelayMs());
        demoStateService.recordTimelineMessage("Bank mode updated to " + mode.name());
        return ResponseEntity.ok(Map.of(
                "mode", mode.name(),
                "timeoutMs", bankSimulatorService.getTimeoutDuration().toMillis(),
                "status", "updated"
        ));
    }

    @GetMapping("/mode")
    public ResponseEntity<Map<String, Object>> getMode() {
        return ResponseEntity.ok(Map.of(
                "mode", bankSimulatorService.getCurrentMode().name(),
                "timeoutMs", bankSimulatorService.getTimeoutDuration().toMillis()
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "mode", bankSimulatorService.getCurrentMode().name(),
                "status", "ready"
        ));
    }
}
