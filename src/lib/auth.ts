import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO1n3Nw8V1QO0N5c9m0Wz2n3S3rXQ6dJq";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) throw new InvalidCredentials();

        const { email, password } = parsed.data;
        const admin = await prisma.admin.findUnique({
          where: { email: email.toLowerCase() },
        });

        const matches = await bcrypt.compare(
          password,
          admin?.passwordHash ?? DUMMY_HASH,
        );
        if (!admin || !matches) throw new InvalidCredentials();

        return { id: admin.id, email: admin.email, name: admin.name ?? admin.email };
      },
    }),
  ],
});

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Chưa đăng nhập.");
  }
  return session.user;
}
