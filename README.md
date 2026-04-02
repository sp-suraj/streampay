# StreamPay: Event-Driven Analytics & Payment Pipeline

StreamPay is a high-throughput, fault-tolerant microservice architecture designed to handle concurrent payment processing and real-time streaming analytics. Built to demonstrate enterprise-grade system design, it features distributed queues, stream processing, database-level idempotency, and a secure real-time observability dashboard.

## 🏗 System Architecture

The architecture decouples ingestion, processing, and visualization into distinct services:

1. **Ingestion API (Express):** Receives high-volume traffic. Authenticates requests via JWT and acts as a producer for Kafka and BullMQ.
2. **Payment Worker (BullMQ + PostgreSQL):** Processes financial transactions with a "Defense in Depth" strategy against duplicate charges.
3. **Analytics Worker (Kafka + Redis):** Consumes high-throughput streaming events and calculates concurrent active users using a sliding-window algorithm.
4. **Live Dashboard (React + WebSockets):** Subscribes to the analytics worker for real-time visualization of system load.

## 🚀 Key Engineering Decisions (SDE-2 Highlights)

### 1. "Defense in Depth" Idempotency

To prevent double-billing during network retries or user double-clicks, the system implements two layers of idempotency:

- **Queue-Level (The Bouncer):** Uses deterministic `jobId` hashing in BullMQ to reject duplicate API requests before they enter the queue.
- **Database-Level (The Vault):** Workers query the PostgreSQL database (via Drizzle ORM) to verify active subscription states before initiating payment gateway calls.

### 2. Fault Tolerance & Resilience

- **Graceful Shutdowns:** Implements `SIGINT/SIGTERM` process listeners across all Node.js services to cleanly drain Kafka partitions, disconnect Redis sockets, and complete in-flight HTTP requests before container termination.
- **Exponential Backoff:** Payment queue utilizes automatic retry policies with exponential backoff to handle transient network failures (e.g., payment gateway timeouts).

### 3. Real-Time Analytics via Sliding Window

Instead of a standard O(N) database query, concurrent presence detection is handled entirely in memory using **Redis Sorted Sets**:

- Kafka heartbeat events are added to a Sorted Set using `Date.now()` as the score (`ZADD`).
- A background interval runs `ZREMRANGEBYSCORE` to efficiently prune users inactive for >10 seconds.
- `ZCARD` retrieves the exact concurrent viewer count in O(log(N)) time and broadcasts it to the frontend via WebSockets.

### 4. Secure & Resilient Frontend Architecture

- **Custom Hooks:** Abstracted WebSocket lifecycle and data-fetching logic into a reusable `useLiveMetrics` hook, ensuring separation of concerns and preventing unnecessary DOM re-renders.
- **Connection Security:** WebSocket connections are secured via JWT middleware during the initial handshake protocol, rejecting unauthenticated TCP connections.

## 💻 Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Message Broker / Queues:** Apache Kafka (KRaft mode), BullMQ
- **Databases / Cache:** PostgreSQL, Redis (IORedis), Drizzle ORM
- **Real-time:** Socket.io (WebSockets), JSON Web Tokens (JWT)
- **Frontend:** React, TypeScript, Recharts

## 🛠 Local Setup & Running

**Prerequisites:** Docker (for Kafka/Redis) and Node.js v18+.

**1. Start Infrastructure**
Ensure your local Redis and Kafka instances are running.

```bash
# Example if using Docker Compose
docker-compose up -d
```

**2. Start the Backend Services**
Open two separate terminals for the microservices:

```bash
# Terminal 1: Start the Ingestion API (Port 3000)
npm run start:api

# Terminal 2: Start the Analytics/WebSocket Worker (Port 3001)
npm run start:analytics
```

**3. Start the React Dashboard**

```bash
# Terminal 3: Navigate to the frontend directory
cd frontend
npm start
```

**4. Run the Load Test**
To see the real-time analytics graph update, simulate high traffic to the heartbeat endpoint:

```bash
while true; do curl -X POST http://localhost:3000/api/analytics/heartbeat -H "Content-Type: application/json" -d '{"userId": "123", "contentId": "abc"}'; sleep 0.1; done
```
