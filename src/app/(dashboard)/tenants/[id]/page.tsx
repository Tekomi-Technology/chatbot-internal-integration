import { ArrowLeft, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { ApiKeysTab } from "@/components/tenants/api-keys-tab";
import { EmbedTab } from "@/components/tenants/embed-tab";
import { GeneralTab } from "@/components/tenants/general-tab";
import { MetaTab } from "@/components/tenants/meta-tab";
import { PluginTab } from "@/components/tenants/plugin-tab";
import { TenantDetailTabs } from "@/components/tenants/tenant-detail-tabs";
import { WidgetConfigTab } from "@/components/tenants/widget-config-tab";
import { ZaloTab } from "@/components/tenants/zalo-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decryptSecret, maskSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildEmbedSnippet } from "@/server/embed-script";
import {
  disconnectMessengerChannelAction,
  updateMessengerChannelAction,
} from "@/server/actions/messenger";
import { deleteTenantAction, updateTenantAction } from "@/server/actions/tenants";
import { updateWidgetConfigAction } from "@/server/actions/widget-config";
import {
  disconnectZaloChannelAction,
  updateZaloChannelAction,
} from "@/server/actions/zalo";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: `${tenant?.name ?? "Tenant"} · Chatbot Dashboard` };
}

const DEFAULT_WIDGET_CONFIG = {
  mode: "BUBBLE",
  position: "BOTTOM_RIGHT",
  botName: "Trợ lý AI",
  logoUrl: null,
  primaryColor: "#4F46E5",
  welcomeMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
  inputPlaceholder: "Nhập câu hỏi của bạn...",
} as const;

export default async function TenantDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      apiKeys: { orderBy: { createdAt: "desc" } },
      domains: { orderBy: { domain: "asc" } },
      widgetConfig: true,
      messengerChannel: true,
      zaloChannel: true,
    },
  });

  if (!tenant) notFound();

  const UNDECRYPTABLE = "⚠ không giải mã được (kiểm tra ENCRYPTION_KEY)";

  let difyApiKeyMasked: string;
  try {
    difyApiKeyMasked = maskSecret(decryptSecret(tenant.difyApiKeyEncrypted));
  } catch {
    difyApiKeyMasked = UNDECRYPTABLE;
  }

  const channel = tenant.messengerChannel;
  let pageAccessTokenMasked = "";
  if (channel) {
    try {
      pageAccessTokenMasked = maskSecret(
        decryptSecret(channel.pageAccessTokenEncrypted),
      );
    } catch {
      pageAccessTokenMasked = UNDECRYPTABLE;
    }
  }

  const zaloChannel = tenant.zaloChannel;
  let refreshTokenMasked = "";
  let oaSecretKeyMasked: string | null = null;
  if (zaloChannel) {
    try {
      refreshTokenMasked = maskSecret(decryptSecret(zaloChannel.refreshTokenEncrypted));
    } catch {
      refreshTokenMasked = UNDECRYPTABLE;
    }

    if (zaloChannel.oaSecretKeyEncrypted) {
      try {
        oaSecretKeyMasked = maskSecret(decryptSecret(zaloChannel.oaSecretKeyEncrypted));
      } catch {
        oaSecretKeyMasked = UNDECRYPTABLE;
      }
    }
  }

  const dateLabel = (value: Date | null) =>
    value?.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) ?? null;

  const widgetConfig = tenant.widgetConfig ?? DEFAULT_WIDGET_CONFIG;
  const embedKey = tenant.apiKeys.find(
    (key) => key.type === "PUBLIC" && key.isActive,
  )?.keyValue;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/tenants">
            <ArrowLeft />
            Danh sách tenant
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{tenant.name}</h1>
            <Badge variant={tenant.status === "ACTIVE" ? "success" : "neutral"}>
              {tenant.status === "ACTIVE" ? "Đang hoạt động" : "Đã tắt"}
            </Badge>
          </div>

          <ConfirmActionButton
            action={deleteTenantAction.bind(null, tenant.id)}
            variant="outline"
            size="sm"
            title={`Xoá tenant "${tenant.name}"?`}
            description="Xoá luôn toàn bộ API key, domain whitelist và cấu hình widget. Không khôi phục được."
            confirmLabel="Xoá tenant"
          >
            <Trash2 />
            Xoá
          </ConfirmActionButton>
        </div>
      </div>

      <TenantDetailTabs
        defaultTab={tab}
        general={
          <GeneralTab
            tenant={{
              name: tenant.name,
              slug: tenant.slug,
              status: tenant.status,
              difyAppId: tenant.difyAppId,
              difyApiBaseUrl: tenant.difyApiBaseUrl,
              difyApiKeyMasked,
            }}
            action={updateTenantAction.bind(null, tenant.id)}
          />
        }
        apiKeys={
          <ApiKeysTab
            tenantId={tenant.id}
            apiKeys={tenant.apiKeys}
            domains={tenant.domains}
          />
        }
        widget={
          <WidgetConfigTab
            config={{
              mode: widgetConfig.mode,
              position: widgetConfig.position,
              botName: widgetConfig.botName,
              logoUrl: widgetConfig.logoUrl,
              primaryColor: widgetConfig.primaryColor,
              welcomeMessage: widgetConfig.welcomeMessage,
              inputPlaceholder: widgetConfig.inputPlaceholder,
            }}
            action={updateWidgetConfigAction.bind(null, tenant.id)}
          />
        }
        meta={
          <MetaTab
            channel={
              channel
                ? {
                    pageId: channel.pageId,
                    pageName: channel.pageName,
                    isActive: channel.isActive,
                    pageAccessTokenMasked,
                  }
                : null
            }
            callbackUrl={`${env.publicAppUrl}/api/channels/messenger`}
            verifyToken={env.messenger.verifyToken}
            action={updateMessengerChannelAction.bind(null, tenant.id)}
            disconnectAction={disconnectMessengerChannelAction.bind(
              null,
              tenant.id,
            )}
          />
        }
        zalo={
          <ZaloTab
            channel={
              zaloChannel
                ? {
                    oaId: zaloChannel.oaId,
                    oaName: zaloChannel.oaName,
                    isActive: zaloChannel.isActive,
                    refreshTokenMasked,
                    oaSecretKeyMasked,
                    refreshTokenUpdatedAtLabel:
                      dateLabel(zaloChannel.refreshTokenUpdatedAt) ?? "—",
                    accessTokenExpiresAtLabel: dateLabel(
                      zaloChannel.accessTokenExpiresAt,
                    ),
                    lastRefreshError: zaloChannel.lastRefreshError,
                  }
                : null
            }
            webhookUrl={`${env.publicAppUrl}/api/channels/zalo`}
            appConfigured={Boolean(env.zalo.appId && env.zalo.secretKey)}
            action={updateZaloChannelAction.bind(null, tenant.id)}
            disconnectAction={disconnectZaloChannelAction.bind(null, tenant.id)}
          />
        }
        plugin={<PluginTab />}
        embed={
          <EmbedTab
            apiKey={embedKey ?? null}
            scriptUrl={`${env.publicAppUrl}/widget.js`}
            snippet={
              embedKey
                ? buildEmbedSnippet({
                    appUrl: env.publicAppUrl,
                    apiKey: embedKey,
                    mode: widgetConfig.mode,
                  })
                : null
            }
          />
        }
      />
    </div>
  );
}
