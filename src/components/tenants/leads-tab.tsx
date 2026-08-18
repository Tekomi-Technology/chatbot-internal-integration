import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

export type ConversationRow = {
  id: string | null;
  fullName: string | null;
  phone: string | null;
  staffActive: boolean;
  lastMessageAt: Date;
};

export function LeadsTab({
  tenantId,
  conversations,
  total,
}: {
  tenantId: string;
  conversations: ConversationRow[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Khách hàng</CardTitle>
      </CardHeader>

      <CardContent>
        {conversations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có khách nào chat qua widget.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tin cuối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id ?? `lead-${conversation.phone}-${conversation.lastMessageAt.getTime()}`}>
                    <TableCell className="font-medium">
                      {conversation.id ? (
                        <Link
                          href={`/tenants/${tenantId}/conversations/${conversation.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {conversation.fullName
                            ? `${conversation.fullName} · ${conversation.phone}`
                            : "Chưa để lại thông tin"}
                        </Link>
                      ) : (
                        <span>{conversation.fullName} · {conversation.phone}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {conversation.id ? (
                        <Badge variant={conversation.staffActive ? "destructive" : "neutral"}>
                          {conversation.staffActive ? "Nhân viên đang xử lý" : "Bot đang trả lời"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Chưa chat</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(conversation.lastMessageAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">{total} hội thoại</p>
      </CardContent>
    </Card>
  );
}
