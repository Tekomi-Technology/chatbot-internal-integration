import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NewTenantForm } from "@/components/tenants/new-tenant-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tạo tenant · Chatbot Dashboard" };

export default function NewTenantPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/tenants">
            <ArrowLeft />
            Danh sách tenant
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Tạo tenant mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sau khi tạo, hệ thống tự sinh sẵn một public key và cấu hình widget mặc
          định để bạn lấy mã nhúng ngay.
        </p>
      </div>

      <NewTenantForm />
    </div>
  );
}
