import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;
export default proxy;

export const config = {
  matcher: [
    "/((?!api/auth|api/widget|_next/static|_next/image|widget.js|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
