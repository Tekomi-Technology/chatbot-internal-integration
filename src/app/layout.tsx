import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Chatbot Dashboard",
  description: "Quản trị chatbot AI đa tenant",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
