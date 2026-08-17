import { Bot, Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/submit-button";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/tenants" className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </span>
            <span className="text-sm font-semibold">Chatbot Dashboard</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form action={logoutAction}>
              <SubmitButton variant="ghost" size="sm">
                Đăng xuất
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <nav className="w-48 shrink-0">
          <Link
            href="/tenants"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <Building2 className="size-4 text-muted-foreground" />
            Tenant
          </Link>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
