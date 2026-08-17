import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConversationThread } from "@/components/tenants/conversation-thread";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string; conversationId: string }>;
}) {
  const { id: tenantId, conversationId } = await params;

  const conversation = await prisma.widgetConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      tenantId: true,
      sessionId: true,
      staffActive: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { sender: true, text: true, createdAt: true },
      },
    },
  });

  if (!conversation || conversation.tenantId !== tenantId) notFound();

  const lead = await prisma.lead.findUnique({
    where: { tenantId_sessionId: { tenantId, sessionId: conversation.sessionId } },
    select: { fullName: true, phone: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href={`/tenants/${tenantId}?tab=leads`}>
            <ArrowLeft />
            Danh sách khách hàng
          </Link>
        </Button>

        <h1 className="text-xl font-semibold tracking-tight">
          {lead ? `${lead.fullName} · ${lead.phone}` : "Khách chưa để lại thông tin"}
        </h1>
      </div>

      <ConversationThread
        tenantId={tenantId}
        conversationId={conversation.id}
        staffActive={conversation.staffActive}
        initialMessages={conversation.messages.map((message) => ({
          sender: message.sender,
          text: message.text,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
