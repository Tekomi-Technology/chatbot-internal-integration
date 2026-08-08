import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

// Prisma 7 chạy qua driver adapter, không còn Rust query engine.
function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

// Dev mode hot-reload sẽ tạo lại module liên tục -> cache client trên globalThis
// để không mở thêm connection pool mỗi lần reload.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
