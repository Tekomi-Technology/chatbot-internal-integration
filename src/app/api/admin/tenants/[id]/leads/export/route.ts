import { auth } from "@/lib/auth";
import { parseLeadFields, readLeadExtra } from "@/lib/lead-fields";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

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
    select: {
      slug: true,
      widgetConfig: { select: { leadFormFields: true } },
    },
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
      extra: true,
    },
  });

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const extras = leads.map((lead) => readLeadExtra(lead.extra));

  const columns = parseLeadFields(tenant.widgetConfig?.leadFormFields).map(
    (field) => ({ key: field.key, label: field.label }),
  );
  const known = new Set(columns.map((column) => column.key));

  for (const extra of extras) {
    for (const key of Object.keys(extra)) {
      if (known.has(key)) continue;
      known.add(key);
      columns.push({ key, label: `${key} (đã gỡ)` });
    }
  }

  const rows = leads.map((lead, index) =>
    [
      csvCell(lead.fullName),
      csvCell(`="${lead.phone}"`),
      ...columns.map((column) => csvCell(extras[index][column.key] ?? "")),
      csvCell(formatter.format(lead.createdAt)),
      csvCell(lead.pageUrl ?? ""),
      csvCell(lead.sessionId),
    ].join(","),
  );

  const header = [
    "Họ và tên",
    "Số điện thoại",
    ...columns.map((column) => column.label),
    "Thời gian", 
    "Trang",
    "Session",
  ];

  const body = `﻿${[header.map(csvCell).join(","), ...rows].join("\r\n")}\r\n`;
  const filename = `leads-${tenant.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
