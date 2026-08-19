package com.example.payment.controller;

import com.example.payment.dto.BankModeRequest;
import com.example.payment.dto.DemoStatsResponse;
import com.example.payment.service.StatsService;
import com.example.payment.simulator.BankSimulatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin("*")
public class DemoController {

    private final StatsService statsService;
    private final BankSimulatorService bankSimulatorService;

    public DemoController(StatsService statsService, BankSimulatorService bankSimulatorService) {
        this.statsService = statsService;
        this.bankSimulatorService = bankSimulatorService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DemoStatsResponse> getStats() {
        return ResponseEntity.ok(statsService.getStats());
    }
    
    @PostMapping("/bank/mode")
    public ResponseEntity<Void> setBankMode(@RequestBody BankModeRequest req) {
        bankSimulatorService.setMode(req.getMode(), req.getDelayMs());
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/bank/status")
    public ResponseEntity<Map<String, Object>> getBankStatus() {
        return ResponseEntity.ok(bankSimulatorService.getStatus());
    }
    
    @GetMapping("/bank/transactions/{transactionId}")
    public ResponseEntity<Map<String, Object>> getBankTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(Map.of("status", bankSimulatorService.getTransactionStatus(transactionId)));
    }
}