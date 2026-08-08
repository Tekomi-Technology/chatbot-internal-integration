import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

/**
 * Next.js 16 đổi tên `middleware.ts` thành `proxy.ts` và cố định runtime là
 * Node.js. Ở đây vẫn chỉ dùng `authConfig` (không Prisma) vì việc chặn route
 * chỉ cần verify JWT trong cookie — không cần truy vấn DB ở mỗi request.
 *
 * Logic cho phép/chặn nằm trong callback `authorized` của authConfig.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth;
export default proxy;

export const config = {
  matcher: [
    /*
     * Bỏ qua asset tĩnh và toàn bộ /api/widget/* — widget là endpoint công khai,
     * tự xác thực bằng API key + domain whitelist chứ không dùng session admin.
     */
    "/((?!api/auth|api/widget|_next/static|_next/image|widget.js|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
