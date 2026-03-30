import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "./db";
import * as dotenv from "dotenv";
import { subscriptions } from "./db/schema";
import { and, eq } from "drizzle-orm";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const paymentWorker = new Worker(
  "payment-queue",
  async (job) => {
    console.log(
      `[Worker] picked up the job ${job.id} to process for user ${job.data.userId}`,
    );

    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, job.data.userId),
          eq(subscriptions.status, "active"),
        ),
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      console.log(
        `[WORKER] Idempotency catch! User ${job.data.userId} is already Premium. Skipping payment.`,
      );
      return;
    }

    // 2. Simulate a slow 3-second call to Stripe/Razorpay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Simulate a random network failure (10% chance) to test robustness later
    if (Math.random() < 0.1) {
      throw new Error("Payment gateway timeout!");
    }

    await db.insert(subscriptions).values({
      userId: job.data.userId,
      planType: job.data.planType,
      isPremium: true,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log(
      `[WORKER] Job ${job.id} complete. User ${job.data.userId} upgraded to Premium.`,
    );
  },
  {
    connection,
  },
);

paymentWorker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} FAILED: ${err.message}`);
});

console.log("Payment Worker is running and listening for jobs...");
