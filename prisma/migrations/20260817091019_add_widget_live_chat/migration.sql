-- CreateEnum
CREATE TYPE "WidgetMessageSender" AS ENUM ('CUSTOMER', 'BOT', 'STAFF');

-- AlterTable
ALTER TABLE "widget_configs" ADD COLUMN     "staff_resume_hours" INTEGER NOT NULL DEFAULT 24;

-- CreateTable
CREATE TABLE "widget_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "staff_active" BOOLEAN NOT NULL DEFAULT false,
    "last_staff_reply_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widget_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender" "WidgetMessageSender" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widget_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "widget_conversations_tenant_id_last_message_at_idx" ON "widget_conversations"("tenant_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "widget_conversations_tenant_id_session_id_key" ON "widget_conversations"("tenant_id", "session_id");

-- CreateIndex
CREATE INDEX "widget_messages_conversation_id_created_at_idx" ON "widget_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "widget_conversations" ADD CONSTRAINT "widget_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_messages" ADD CONSTRAINT "widget_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "widget_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
