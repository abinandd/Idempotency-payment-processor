package com.example.payment.service;

import com.example.payment.repository.PaymentRepository;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class HealthService {
    private final RedisConnectionFactory redisConnectionFactory;
    private final PaymentRepository paymentRepository;

    public HealthService(RedisConnectionFactory redisConnectionFactory, PaymentRepository paymentRepository) {
        this.redisConnectionFactory = redisConnectionFactory;
        this.paymentRepository = paymentRepository;
    }

    public Map<String, String> check() {
        return Map.of(
                "api", "Online",
                "redis", redisUp() ? "Connected" : "Disconnected",
                "postgres", databaseUp() ? "Connected" : "Disconnected"
        );
    }

    private boolean redisUp() {
        try (var connection = redisConnectionFactory.getConnection()) {
            connection.ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean databaseUp() {
        try {
            paymentRepository.count();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
