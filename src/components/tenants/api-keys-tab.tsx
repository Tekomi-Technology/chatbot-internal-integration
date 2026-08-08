import { Globe, Trash2 } from "lucide-react";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { CopyButton } from "@/components/copy-button";
import { AddDomainForm } from "@/components/tenants/add-domain-form";
import { CreateApiKeyForm } from "@/components/tenants/create-api-key-form";
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
import {
  addDomainAction,
  createApiKeyAction,
  deleteApiKeyAction,
  reactivateApiKeyAction,
  removeDomainAction,
  revokeApiKeyAction,
} from "@/server/actions/api-keys";
import { formatDateTime } from "@/lib/utils";

export type ApiKeyRow = {
  id: string;
  keyValue: string;
  label: string | null;
  type: "PUBLIC" | "ADMIN";
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export type DomainRow = { id: string; domain: string };

export function ApiKeysTab({
  tenantId,
  apiKeys,
  domains,
}: {
  tenantId: string;
  apiKeys: ApiKeyRow[];
  domains: DomainRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>API key</CardTitle>
          <CardDescription>
            Public key được nhúng công khai trên website tenant — bảo mật thực sự
            đến từ domain whitelist bên dưới, không phải từ việc giấu key.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <CreateApiKeyForm action={createApiKeyAction.bind(null, tenantId)} />

          {apiKeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có key nào.
            </p>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Dùng lần cuối</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                            {key.keyValue}
                          </code>
                          <CopyButton
                            value={key.keyValue}
                            label=""
                            variant="ghost"
                            size="icon"
                            aria-label="Copy key"
                          />
                        </div>
                        {key.label ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {key.label}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.type === "ADMIN" ? "default" : "neutral"}>
                          {key.type === "ADMIN" ? "Admin" : "Public"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.isActive ? "success" : "destructive"}>
                          {key.isActive ? "Active" : "Đã thu hồi"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(key.lastUsedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {key.isActive ? (
                            <ConfirmActionButton
                              action={revokeApiKeyAction.bind(null, tenantId, key.id)}
                              variant="outline"
                              size="sm"
                              title="Thu hồi API key?"
                              description="Widget đang dùng key này sẽ ngừng hoạt động ngay lập tức."
                              confirmLabel="Thu hồi"
                            >
                              Thu hồi
                            </ConfirmActionButton>
                          ) : (
                            <ConfirmActionButton
                              action={reactivateApiKeyAction.bind(null, tenantId, key.id)}
                              variant="outline"
                              size="sm"
                              title="Kích hoạt lại key?"
                              description="Key sẽ hoạt động trở lại với mọi domain trong whitelist."
                              confirmLabel="Kích hoạt"
                              confirmVariant="default"
                            >
                              Kích hoạt
                            </ConfirmActionButton>
                          )}
                          <ConfirmActionButton
                            action={deleteApiKeyAction.bind(null, tenantId, key.id)}
                            variant="ghost"
                            size="icon"
                            title="Xoá hẳn API key?"
                            description="Không khôi phục được. Nếu chỉ muốn tạm dừng, hãy dùng “Thu hồi”."
                            confirmLabel="Xoá"
                            aria-label="Xoá key"
                          >
                            <Trash2 />
                          </ConfirmActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domain whitelist</CardTitle>
          <CardDescription>
            Chỉ những domain dưới đây mới gọi được <code>/api/widget/chat</code>.
            Whitelist rỗng nghĩa là mọi request chat đều bị từ chối.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <AddDomainForm action={addDomainAction.bind(null, tenantId)} />

          {domains.length === 0 ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
              <Globe className="size-4 shrink-0" />
              Chưa có domain nào — widget sẽ không chat được cho tới khi bạn thêm.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {domains.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-1 rounded-full border border-border bg-secondary py-1 pl-3 pr-1 text-sm"
                >
                  <span className="font-mono text-xs">{entry.domain}</span>
                  <ConfirmActionButton
                    action={removeDomainAction.bind(null, tenantId, entry.id)}
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    title={`Gỡ ${entry.domain}?`}
                    description="Website ở domain này sẽ không gọi được API chat nữa."
                    confirmLabel="Gỡ"
                    aria-label={`Gỡ ${entry.domain}`}
                  >
                    <Trash2 className="size-3.5" />
                  </ConfirmActionButton>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
