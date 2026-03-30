import express from "express";
import IORedis from "ioredis";
import * as dotenv from "dotenv";
import { Queue } from "bullmq";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});
const paymentQueue = new Queue("payment-queue", { connection });

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

app.listen(port, () => console.log(`Ingestion api is running on port ${port}`));
