import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

export const prisma = new PrismaClient();

export async function initDb() {
  if (!env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Database features will fallback to in-memory mocks.");
    return;
  }

  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn("Failed to connect to PostgreSQL. Falling back to mock data modes. Error:", message);
  }
}

