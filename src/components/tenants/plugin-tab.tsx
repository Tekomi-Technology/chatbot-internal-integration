import { Puzzle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PluginTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugin</CardTitle>
        <CardDescription>
          Các plugin mở rộng cho chatbot của tenant này.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-10 text-center">
          <Puzzle className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chưa có plugin nào. Tính năng đang phát triển.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
