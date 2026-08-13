import { Download } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export type LeadRow = {
  id: string;
  fullName: string;
  phone: string;
  pageUrl: string | null;
  createdAt: Date;
  extra: Record<string, string>;
};

export type LeadExtraColumn = { key: string; label: string };

export function LeadsTab({
  tenantId,
  leads,
  total,
  page,
  pageCount,
  leadFormEnabled,
  extraColumns,
}: {
  tenantId: string;
  leads: LeadRow[];
  total: number;
  page: number;
  pageCount: number;
  leadFormEnabled: boolean;
  extraColumns: LeadExtraColumn[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Khách hàng</CardTitle>
            <CardDescription>
              {leadFormEnabled
                ? "Thông tin khách để lại ở form trước khi chat, mới nhất trước."
                : "Form thu thập thông tin đang tắt — bật ở tab “Cấu hình widget” để bắt đầu thu thập."}
            </CardDescription>
          </div>

          {total > 0 ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/admin/tenants/${tenantId}/leads/export`}>
                <Download />
                Tải CSV
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có khách nào để lại thông tin.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    {extraColumns.map((column) => (
                      <TableHead key={column.key}>{column.label}</TableHead>
                    ))}
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.fullName}</TableCell>
                      <TableCell>
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-mono text-sm underline-offset-4 hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </TableCell>
                      {extraColumns.map((column) => (
                        <TableCell key={column.key} className="text-sm">
                          {lead.extra[column.key] || "—"}
                        </TableCell>
                      ))}
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(lead.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[18rem] truncate text-xs text-muted-foreground">
                        {lead.pageUrl ? (
                          <a
                            href={lead.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-4 hover:underline"
                          >
                            {lead.pageUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {total} khách · trang {page}/{pageCount}
              </p>

              {pageCount > 1 ? (
                <div className="flex gap-2">
                  <PageLink
                    tenantId={tenantId}
                    page={page - 1}
                    disabled={page <= 1}
                    label="Trước"
                  />
                  <PageLink
                    tenantId={tenantId}
                    page={page + 1}
                    disabled={page >= pageCount}
                    label="Sau"
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


function PageLink({
  tenantId,
  page,
  disabled,
  label,
}: {
  tenantId: string;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/tenants/${tenantId}?tab=leads&leadPage=${page}`}>{label}</Link>
    </Button>
  );
}
