import express from "express";
import IORedis from "ioredis";
import * as dotenv from "dotenv";
import { Queue } from "bullmq";
import { Kafka } from "kafkajs";
import http from "http";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json());

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});
const paymentQueue = new Queue("payment-queue", { connection });
const kafka = new Kafka({
  clientId: "streampay-api",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();

producer
  .connect()
  .then(() => console.log("Kafka connected successfully!"))
  .catch((err) => console.log("Error", err));

app.post("/api/subscribe", async (req, res) => {
  const { userId, planType } = req.body;

  const job = await paymentQueue.add("process-payment", {
    userId,
    planType,
  });

  console.log(
    `[API] accepted the request. Job Id: ${job.id} added to the queue.`,
  );

  res.status(202).json({
    message: "Payment processing initiated in the background.",
    jobId: job.id,
  });
});

app.post("/api/analytics/heartbeat", async (req, res) => {
  const { userId, contentId } = req.body;

  await producer.send({
    topic: "stream-heartbeats",
    messages: [
      {
        key: String(userId),
        value: JSON.stringify({
          userId,
          contentId,
          status: "watching",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });

  res.status(202).send();
});

server.listen(port, () =>
  console.log(`Ingestion api is running on port ${port}`),
);
