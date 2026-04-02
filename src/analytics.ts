import { Kafka } from "kafkajs";
import IORedis from "ioredis";
import * as dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const kafka = new Kafka({
  clientId: "analytics-worker",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "live-dashboard-group" });

const run = async () => {
  console.log("Redis connected (IORedis auto-connect)");

  await consumer.connect();
  console.log(`[ANALYTICS] Connected to Kafka`);

  await consumer.subscribe({
    topic: "stream-heartbeats",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      const { userId } = event;

      await redis.zadd("active_users", Date.now(), userId);
    },
  });

  setInterval(async () => {
    const tenSecAgo = Date.now() - 10000;

    await redis.zremrangebyscore("active_users", "-inf", tenSecAgo);
    const activeCount = await redis.zcard("active_users");

    console.log(`[LIVE METRICS] ${activeCount} concurrent viewers.`);

    io.emit("live_metrics", {
      count: activeCount,
      time: new Date().toLocaleTimeString(),
    });
  }, 2000);

  server.listen(3001, () => {
    console.log("Analytics Worker & WebSocket server running on port 3001");
  });
};

run()
  .then(() => console.log("Worker initialized successfully!"))
  .catch((err) => {
    console.error("Fatal Worker Error:", err);
    process.exit(1);
  });
