import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function initProductionDb() {
  const dbPath = "/tmp/dev.db";
  if (!fs.existsSync(dbPath)) {
    try {
      // Copy the pre-built database (created during build) to /tmp
      const source = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dbPath);
      }
    } catch (e) {
      console.error("Failed to initialize database:", e);
    }
  }
}

function createPrismaClient(): PrismaClient {
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production";
  if (isProduction) {
    initProductionDb();
    return new PrismaClient({
      datasources: { db: { url: "file:/tmp/dev.db" } },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
