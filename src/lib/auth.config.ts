import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname, search } = request.nextUrl;

      const isProtected =
        pathname === "/" ||
        pathname.startsWith("/tenants") ||
        pathname.startsWith("/api/admin");

      if (isProtected && !isLoggedIn) {
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
