// src/seed.ts
import { db } from "./db/index";
import { users } from "./db/schema";

async function seed() {
  await db.insert(users).values({
    name: "Suraj",
    email: "suraj@example.com",
  });
  console.log("User created! You can now run the queue.");
  process.exit(0);
}

seed();
