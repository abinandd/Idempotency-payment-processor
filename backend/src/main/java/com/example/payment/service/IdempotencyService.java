package com.example.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Service
public class IdempotencyService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlSeconds;

    public IdempotencyService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, @Value("${app.idempotency.ttl:86400}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttlSeconds = ttlSeconds;
    }

    public boolean acquireLock(String idempotencyKey, String payloadHash) {
        String key = "idempotency:" + idempotencyKey;
        // Atomic SET NX
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "PROCESSING:" + payloadHash, Duration.ofSeconds(ttlSeconds));
        return Boolean.TRUE.equals(acquired);
    }
    
    public void updateState(String idempotencyKey, Object response) {
        try {
            String key = "idempotency:" + idempotencyKey;
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, "COMPLETED:" + json, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            throw new RuntimeException("Failed to update idempotency state", e);
        }
    }
    
    public String getState(String idempotencyKey) {
        return redisTemplate.opsForValue().get("idempotency:" + idempotencyKey);
    }
    
    public String generatePayloadHash(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash payload", e);
        }
    }
}