import { AlertCircle } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmbedTab({
  snippet,
  apiKey,
  scriptUrl,
}: {
  snippet: string | null;
  apiKey: string | null;
  scriptUrl: string;
}) {
  if (!snippet || !apiKey) {
    return (
      <Card>
        <CardContent className="pt-5">
          <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            Tenant chưa có public key nào đang hoạt động. Sang tab “API key &
            Domain” để tạo key trước.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mã nhúng</CardTitle>
          <CardDescription>
            Gửi đoạn này cho tenant dán vào website của họ. Script tải từ{" "}
            <code className="font-mono text-xs">{scriptUrl}</code>.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <pre className="overflow-x-auto rounded-md border border-border bg-secondary p-4 font-mono text-xs leading-relaxed">
            {snippet}
          </pre>
          <div className="flex justify-end">
            <CopyButton value={snippet} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trước khi gửi cho tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>
              Thêm domain website của tenant vào whitelist — thiếu bước này widget
              hiện được nhưng gửi tin nhắn sẽ bị chặn 403.
            </li>
            <li>
              Kiểm tra tenant đang ở trạng thái <strong>Đang hoạt động</strong>.
            </li>
            <li>
              Đổi chế độ hiển thị ở tab “Cấu hình widget” nếu tenant muốn khung
              chat inline thay vì bong bóng — đoạn mã trên sẽ tự đổi theo.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
