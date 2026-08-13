import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildEmbedSnippet } from "@/server/embed-script";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const keyId = new URL(request.url).searchParams.get("keyId");

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      name: true,
      widgetConfig: { select: { mode: true } },
      apiKeys: {
        where: { type: "PUBLIC", isActive: true, ...(keyId ? { id: keyId } : {}) },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { keyValue: true },
      },
    },
  });

  if (!tenant) {
    return Response.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const apiKey = tenant.apiKeys[0]?.keyValue;
  if (!apiKey) {
    return Response.json(
      {
        error: "no_active_public_key",
        message: "Tenant chưa có public key nào đang hoạt động. Hãy tạo key trước.",
      },
      { status: 409 },
    );
  }

  const mode = tenant.widgetConfig?.mode ?? "BUBBLE";

  return Response.json({
    tenantName: tenant.name,
    apiKey,
    mode,
    scriptUrl: `${env.publicAppUrl}/widget.js`,
    snippet: buildEmbedSnippet({ appUrl: env.publicAppUrl, apiKey, mode }),
  });
}
