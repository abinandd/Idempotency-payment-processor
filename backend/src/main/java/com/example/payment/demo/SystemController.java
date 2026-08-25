package com.example.payment.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin("*")
public class SystemController {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getHealth() {
        String dbStatus = "Disconnected";
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(1)) {
                dbStatus = "Connected";
            }
        } catch (Exception e) {
            dbStatus = "Disconnected";
        }

        String redisStatus = "Disconnected";
        try {
            String ping = redisTemplate.getConnectionFactory().getConnection().ping();
            if ("PONG".equalsIgnoreCase(ping)) {
                redisStatus = "Connected";
            }
        } catch (Exception e) {
            redisStatus = "Disconnected";
        }

        return ResponseEntity.ok(Map.of(
                "api", "Online",
                "redis", redisStatus,
                "postgres", dbStatus
        ));
    }
}
