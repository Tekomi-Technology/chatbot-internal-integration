-- CreateTable
CREATE TABLE "messenger_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_name" TEXT,
    "page_access_token_encrypted" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_conversations" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "psid" TEXT NOT NULL,
    "dify_conversation_id" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messenger_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messenger_channels_tenant_id_key" ON "messenger_channels"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_channels_page_id_key" ON "messenger_channels"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_conversations_channel_id_psid_key" ON "messenger_conversations"("channel_id", "psid");

-- AddForeignKey
ALTER TABLE "messenger_channels" ADD CONSTRAINT "messenger_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_conversations" ADD CONSTRAINT "messenger_conversations_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messenger_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
