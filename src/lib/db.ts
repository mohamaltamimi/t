import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

function initProductionDb() {
  const dbPath = "/tmp/dev.db";
  if (!fs.existsSync(dbPath)) {
    try {
      const schemaSource = path.join(process.cwd(), "prisma", "schema.prisma");
      const schemaDest = "/tmp/schema.prisma";
      const schemaContent = fs.readFileSync(schemaSource, "utf-8");
      const updatedSchema = schemaContent.replace(
        'url      = env("DATABASE_URL")',
        'url      = "file:/tmp/dev.db"'
      );
      fs.writeFileSync(schemaDest, updatedSchema);
      execSync(`npx prisma db push --schema=${schemaDest} --skip-generate`, {
        env: { ...process.env, DATABASE_URL: "file:/tmp/dev.db" },
      });
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
