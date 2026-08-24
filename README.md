# Idempotent Payment Processing System

A production-style payment gateway demonstrating idempotency, concurrency control, and resilience.

## Architecture
- **Backend:** Java 21, Spring Boot 3
- **Database:** PostgreSQL (persistent payment records)
- **Cache/Locking:** Redis (idempotency state and atomic SET NX)
- **Frontend:** Angular 21

## How Idempotency Works
1. Client sends `Idempotency-Key` header.
2. The API attempts an atomic `SET NX` in Redis.
3. If successful, payment processes. If failed, it means another request with the same key is processing or completed.
4. Handles bank simulation (SUCCESS, FAILURE, TIMEOUT).
5. Reconciliation job fixes UNKNOWN payments from timeouts.

## Running Locally
Backend runs on `:8080`, Frontend on `:3000`.

## Demo
Use the UI to simulate sending 10 identical requests simultaneously. Observe that the bank is only called once.
