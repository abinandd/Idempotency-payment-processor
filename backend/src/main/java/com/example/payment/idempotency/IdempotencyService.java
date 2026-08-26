package com.example.payment.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IdempotencyService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlSeconds;
    private final Map<String, String> fallbackStore = new ConcurrentHashMap<>();

    public IdempotencyService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.idempotency.ttl:86400}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttlSeconds = ttlSeconds;
    }

    public boolean acquireLock(String idempotencyKey, String payloadHash) {
        String key = keyFor(idempotencyKey);
        String value = "PROCESSING:" + payloadHash;

        try {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, value, Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(acquired);
        } catch (Exception exception) {
            return fallbackStore.putIfAbsent(key, value) == null;
        }
    }
    
    public void updateState(String idempotencyKey, Object response, String payloadHash) {
        String key = keyFor(idempotencyKey);
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, "COMPLETED:" + payloadHash + ":" + json, Duration.ofSeconds(ttlSeconds));
        } catch (Exception exception) {
            try {
                String json = objectMapper.writeValueAsString(response);
                fallbackStore.put(key, "COMPLETED:" + payloadHash + ":" + json);
            } catch (Exception nestedException) {
                throw new RuntimeException("Failed to update idempotency state", nestedException);
            }
        }
    }
    
    public String getState(String idempotencyKey) {
        String key = keyFor(idempotencyKey);
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception exception) {
            return fallbackStore.get(key);
        }
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

    private String keyFor(String idempotencyKey) {
        return "idempotency:" + idempotencyKey;
    }
}
