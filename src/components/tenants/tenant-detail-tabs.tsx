"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Vỏ tab phía client. Nội dung từng tab được render sẵn ở Server Component và
 * truyền xuống dưới dạng ReactNode, nên bảng/danh sách vẫn là server-rendered.
 */
export function TenantDetailTabs({
  general,
  apiKeys,
  widget,
  embed,
}: {
  general: React.ReactNode;
  apiKeys: React.ReactNode;
  widget: React.ReactNode;
  embed: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">Thông tin</TabsTrigger>
        <TabsTrigger value="api-keys">API key & Domain</TabsTrigger>
        <TabsTrigger value="widget">Cấu hình widget</TabsTrigger>
        <TabsTrigger value="embed">Mã nhúng</TabsTrigger>
      </TabsList>

      <TabsContent value="general">{general}</TabsContent>
      <TabsContent value="api-keys">{apiKeys}</TabsContent>
      <TabsContent value="widget">{widget}</TabsContent>
      <TabsContent value="embed">{embed}</TabsContent>
    </Tabs>
  );
}
