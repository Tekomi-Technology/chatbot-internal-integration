import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWidgetMessage } from "@/lib/widget-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: tenantId, conversationId } = await params;

  const conversation = await prisma.widgetConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, tenantId: true },
  });

  if (!conversation || conversation.tenantId !== tenantId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const since = new URL(request.url).searchParams.get("since")?.trim();
  const sinceDate = since ? new Date(since) : null;
  if (since && (!sinceDate || Number.isNaN(sinceDate.getTime()))) {
    return Response.json({ error: "invalid_since" }, { status: 400 });
  }

  const messages = await prisma.widgetMessage.findMany({
    where: {
      conversationId: conversation.id,
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { sender: true, text: true, createdAt: true },
  });

  return Response.json({ messages: messages.map(serializeWidgetMessage) });
}
