import type { NextAuthConfig } from "next-auth";

/**
 * Phần cấu hình chạy được trên Edge runtime — KHÔNG import Prisma/bcrypt ở đây.
 * `src/middleware.ts` dùng riêng file này; provider thật nằm ở `src/lib/auth.ts`
 * và chỉ chạy trong Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // được thêm ở src/lib/auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname, search } = request.nextUrl;

      const isProtected =
        pathname === "/" ||
        pathname.startsWith("/tenants") ||
        pathname.startsWith("/api/admin");

      if (isProtected && !isLoggedIn) {
        // Với API trả JSON 401 thay vì redirect sang trang HTML.
        if (pathname.startsWith("/api/")) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.nextUrl);
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return Response.redirect(loginUrl);
      }

      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
