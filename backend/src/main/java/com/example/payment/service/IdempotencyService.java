package com.example.payment.service;

import com.example.payment.exception.IdempotencyException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores idempotency state in Redis, falling back to process memory when Redis is unavailable.
 * State values are encoded as {@code PROCESSING:<hash>} or {@code COMPLETED:<hash>:<responseJson>}.
 */
@Service
public class IdempotencyService {
    public static final String PROCESSING_PREFIX = "PROCESSING:";
    public static final String COMPLETED_PREFIX = "COMPLETED:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;
    private final Map<String, String> fallbackStore = new ConcurrentHashMap<>();

    public IdempotencyService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.idempotency.ttl:86400}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    public boolean acquireLock(String idempotencyKey, String payloadHash) {
        String key = keyFor(idempotencyKey);
        String value = PROCESSING_PREFIX + payloadHash;
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(key, value, ttl));
        } catch (Exception exception) {
            return fallbackStore.putIfAbsent(key, value) == null;
        }
    }

    public void releaseLock(String idempotencyKey) {
        String key = keyFor(idempotencyKey);
        fallbackStore.remove(key);
        try {
            redisTemplate.delete(key);
        } catch (Exception exception) {
            // key expires via TTL
        }
    }

    public void updateState(String idempotencyKey, Object response, String payloadHash) {
        String key = keyFor(idempotencyKey);
        String value = COMPLETED_PREFIX + payloadHash + ":" + toJson(response);
        fallbackStore.put(key, value);
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
        } catch (Exception exception) {
            // in-memory copy above keeps the key usable
        }
    }

    public void updateReconciledState(String idempotencyKey, Object response) {
        if (idempotencyKey == null) {
            return;
        }
        String state = getState(idempotencyKey);
        if (state != null && state.startsWith(COMPLETED_PREFIX)) {
            String[] parts = state.substring(COMPLETED_PREFIX.length()).split(":", 2);
            if (parts.length == 2) {
                updateState(idempotencyKey, response, parts[0]);
            }
        }
    }

    public String getState(String idempotencyKey) {
        String key = keyFor(idempotencyKey);
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return value;
            }
        } catch (Exception exception) {
            // fall through to in-memory store
        }
        return fallbackStore.get(key);
    }

    public String generatePayloadHash(Object payload) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to hash payload", e);
        }
    }

    public <T> T parseResponse(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Error parsing idempotency response", e);
        }
    }

    public IdempotencyException keyInUse() {
        return new IdempotencyException("The idempotency key is already in use");
    }

    public IdempotencyException payloadMismatch() {
        return new IdempotencyException("The idempotency key was already used with a different request payload");
    }

    private String toJson(Object response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to update idempotency state", e);
        }
    }

    private String keyFor(String idempotencyKey) {
        return "idempotency:" + idempotencyKey;
    }
}
