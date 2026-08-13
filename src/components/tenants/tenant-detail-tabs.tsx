"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Vỏ tab phía client. Nội dung từng tab được render sẵn ở Server Component và
 * truyền xuống dưới dạng ReactNode, nên bảng/danh sách vẫn là server-rendered.
 */
export function TenantDetailTabs({
  defaultTab,
  general,
  apiKeys,
  widget,
  leads,
  meta,
  plugin,
  embed,
}: {
  /** Cho phép link thẳng vào một tab, ví dụ khi phân trang danh sách khách. */
  defaultTab?: string;
  general: React.ReactNode;
  apiKeys: React.ReactNode;
  widget: React.ReactNode;
  leads: React.ReactNode;
  meta: React.ReactNode;
  plugin: React.ReactNode;
  embed: React.ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultTab ?? "general"}>
      <TabsList>
        <TabsTrigger value="general">Thông tin</TabsTrigger>
        <TabsTrigger value="api-keys">API key & Domain</TabsTrigger>
        <TabsTrigger value="widget">Cấu hình widget</TabsTrigger>
        <TabsTrigger value="leads">Khách hàng</TabsTrigger>
        <TabsTrigger value="meta">Meta</TabsTrigger>
        <TabsTrigger value="plugin">Plugin</TabsTrigger>
        <TabsTrigger value="embed">Mã nhúng</TabsTrigger>
      </TabsList>

      <TabsContent value="general">{general}</TabsContent>
      <TabsContent value="api-keys">{apiKeys}</TabsContent>
      <TabsContent value="widget">{widget}</TabsContent>
      <TabsContent value="leads">{leads}</TabsContent>
      <TabsContent value="meta">{meta}</TabsContent>
      <TabsContent value="plugin">{plugin}</TabsContent>
      <TabsContent value="embed">{embed}</TabsContent>
    </Tabs>
  );
}
