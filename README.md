# Idempotent Payment Processing System

A production-style payment gateway demonstrating idempotency, concurrency control, atomic distributed locking, and reconciliation resilience.

## Architecture
- **Backend:** Java 21, Spring Boot 3
- **Database:** PostgreSQL (with H2 in-memory mode fallback for zero-dependency local development)
- **Cache / Distributed Locking:** Redis (`StringRedisTemplate` with atomic `SET NX` and in-memory `ConcurrentHashMap` fallback)
- **Frontend:** Angular 21 (standalone components, Lucide icons, Sonner toasts)

---

## How Idempotency Works

1. **Client sends `Idempotency-Key` header:** Every payment mutation requires a unique idempotency key.
2. **Atomic Lock Acquisition (`SET NX`):**
   - The gateway hashes the request payload (SHA-256) and attempts an atomic `SET NX` in Redis with state `PROCESSING:<payload_hash>` and TTL.
   - If the lock is successfully acquired, this thread proceeds to process the payment with the bank.
3. **Duplicate Request Detection:**
   - If the lock cannot be acquired:
     - If the existing key state is `PROCESSING` with matching payload: returns `409 Conflict` (`"Processing in progress"`).
     - If the existing key state is `COMPLETED` with matching payload: immediately returns the cached `PaymentResponse` (`200 OK`) without hitting the bank again.
     - If the payload differs from the original request: returns `400 Bad Request` (`"The idempotency key was already used with a different request payload"`).
4. **Bank Simulator Modes:**
   - **`SUCCESS`**: Bank approves the transaction and returns a unique `bankTransactionId`.
   - **`FAILURE`**: Bank rejects the transaction (hard failure flow).
   - **`TIMEOUT`**: Bank delays response simulating a network timeout; the payment is recorded as `UNKNOWN`.
5. **Background Reconciliation Service:**
   - A scheduled job runs periodically to query the bank simulator for transactions in `UNKNOWN` state.
   - It updates the database record and refreshes the idempotency cache once the bank finalizes the transaction.

---

## Running Locally

### Option A: Complete Stack via Docker Compose (Production Ready)
Spins up PostgreSQL 16, Redis 7, Spring Boot Backend, and Nginx-served Angular Frontend with a single command:
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8080`

### Option B: Standalone for Development
#### Prerequisites
- Java 21
- Node.js 20+ & npm
- (Optional) Redis server on `localhost:6379` (automatic in-memory fallback if Redis is not running)
- (Optional) PostgreSQL on `localhost:5432` (automatic in-memory H2 database if `DATABASE_URL` is omitted)

#### 1. Run the Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend starts on `http://localhost:8080`.

#### 2. Run the Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000` with API proxy forwarding `/api` to `http://localhost:8080`.

---

## Running Automated Tests

### Backend Tests (JUnit 5 / Spring Boot Test)
```bash
cd backend
./mvnw clean test
```
Tests include:
- `testConcurrentRequests`: 10 simultaneous threads sharing the same idempotency key (1 success, 9 conflicts).
- `testIdempotentReplayReturnsCachedResponse`: Verifies identical responses returned without calling the bank.
- `testDifferentPayloadWithSameKeyFails`: Verifies payload mismatch detection (HTTP 400).

### Frontend Tests (Vitest / Angular)
```bash
cd frontend
npm test -- --watch=false
```

---

## Demo Walkthrough

1. Open `http://localhost:3000` in your browser.
2. **Concurrent Request Simulator:**
   - Set request count to `10`.
   - Click **"Fire 10 Concurrent Requests"**.
   - **Observe:**
     - 10 simultaneous requests are sent with the same `Idempotency-Key`.
     - Request #1 acquires the lock and is processed by the bank.
     - Requests #2–#10 are blocked by Redis atomic locking (`409 Conflict` or cached replay).
     - The **Actual Bank Calls** counter only increases by **1**, while **Duplicates Blocked** increases by **9**.
3. **Single Payment Processor:**
   - Test individual payments, try different currencies (INR, USD, EUR, GBP), and click "Pay Now" twice with the same key to verify cached replay.
4. **Bank Simulator:**
   - Switch mode to **TIMEOUT**.
   - Send a payment to observe the `UNKNOWN` state.
   - Watch the background **Reconciliation Service** automatically recover the transaction and update the system timeline.
