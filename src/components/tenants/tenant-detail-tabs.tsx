"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function TenantDetailTabs({
  defaultTab,
  general,
  apiKeys,
  widget,
  meta,
  zalo,
  plugin,
  embed,
}: {
  defaultTab?: string;
  general: React.ReactNode;
  apiKeys: React.ReactNode;
  widget: React.ReactNode;
  meta: React.ReactNode;
  zalo: React.ReactNode;
  plugin: React.ReactNode;
  embed: React.ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultTab ?? "general"}>
      <TabsList>
        <TabsTrigger value="general">Thông tin</TabsTrigger>
        <TabsTrigger value="api-keys">API key & Domain</TabsTrigger>
        <TabsTrigger value="widget">Cấu hình widget</TabsTrigger>
        <TabsTrigger value="meta">Meta</TabsTrigger>
        <TabsTrigger value="zalo">Zalo</TabsTrigger>
        <TabsTrigger value="plugin">Plugin</TabsTrigger>
        <TabsTrigger value="embed">Mã nhúng</TabsTrigger>
      </TabsList>

      <TabsContent value="general">{general}</TabsContent>
      <TabsContent value="api-keys">{apiKeys}</TabsContent>
      <TabsContent value="widget">{widget}</TabsContent>
      <TabsContent value="meta">{meta}</TabsContent>
      <TabsContent value="zalo">{zalo}</TabsContent>
      <TabsContent value="plugin">{plugin}</TabsContent>
      <TabsContent value="embed">{embed}</TabsContent>
    </Tabs>
  );
}
