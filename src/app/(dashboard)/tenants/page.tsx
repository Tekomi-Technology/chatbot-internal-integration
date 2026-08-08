import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TenantFilters } from "@/components/tenants/tenant-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenant · Chatbot Dashboard" };

type SearchParams = { q?: string; status?: string };

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, status } = await searchParams;
  const statusFilter = status === "ACTIVE" || status === "INACTIVE" ? status : undefined;
  const query = q?.trim();

  const tenants = await prisma.tenant.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { slug: { contains: query, mode: "insensitive" as const } },
              { difyAppId: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { apiKeys: true, domains: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tenant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Các đơn vị đang sử dụng chatbot. Mỗi tenant gắn với một app riêng trên
            Dify.
          </p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus />
            Tạo tenant
          </Link>
        </Button>
      </div>

      <TenantFilters defaultQuery={query} defaultStatus={statusFilter} />

      <Card>
        {tenants.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {query || statusFilter
              ? "Không có tenant nào khớp bộ lọc."
              : "Chưa có tenant nào. Bấm “Tạo tenant” để bắt đầu."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>API key</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tenant.status === "ACTIVE" ? "success" : "neutral"}
                    >
                      {tenant.status === "ACTIVE" ? "Đang hoạt động" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant._count.apiKeys}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant._count.domains}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(tenant.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
