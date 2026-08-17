import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const generated = randomBytes(9).toString("base64url");
  const password = process.env.SEED_ADMIN_PASSWORD || generated;

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} đã tồn tại — bỏ qua.`);
    return;
  }

  await prisma.admin.create({
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME || "Quản trị viên",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  console.log("Đã tạo tài khoản admin:");
  console.log(`  email    : ${email}`);
  console.log(
    process.env.SEED_ADMIN_PASSWORD
      ? "  mật khẩu : (lấy từ SEED_ADMIN_PASSWORD)"
      : `  mật khẩu : ${password}   <-- lưu lại ngay, không hiển thị lần nữa`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
