import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const HEADER = ["Họ và tên", "Số điện thoại", "Thời gian", "Trang", "Session"];


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!tenant) {
    return Response.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const leads = await prisma.lead.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    select: {
      fullName: true,
      phone: true,
      createdAt: true,
      pageUrl: true,
      sessionId: true,
    },
  });

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const rows = leads.map((lead) =>
    [
      csvCell(lead.fullName),
      csvCell(`="${lead.phone}"`),
      csvCell(formatter.format(lead.createdAt)),
      csvCell(lead.pageUrl ?? ""),
      csvCell(lead.sessionId),
    ].join(","),
  );

  const body = `﻿${[HEADER.map(csvCell).join(","), ...rows].join("\r\n")}\r\n`;
  const filename = `leads-${tenant.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
