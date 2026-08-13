-- CreateTable
CREATE TABLE "zalo_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "oa_id" TEXT NOT NULL,
    "oa_name" TEXT,
    "access_token_encrypted" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_encrypted" TEXT NOT NULL,
    "refresh_token_updated_at" TIMESTAMP(3) NOT NULL,
    "last_refresh_error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_event_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zalo_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zalo_conversations" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "zalo_user_id" TEXT NOT NULL,
    "dify_conversation_id" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zalo_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zalo_channels_tenant_id_key" ON "zalo_channels"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "zalo_channels_oa_id_key" ON "zalo_channels"("oa_id");

-- CreateIndex
CREATE UNIQUE INDEX "zalo_conversations_channel_id_zalo_user_id_key" ON "zalo_conversations"("channel_id", "zalo_user_id");

-- CreateIndex
CREATE INDEX "zalo_conversations_channel_id_idx" ON "zalo_conversations"("channel_id");

-- AddForeignKey
ALTER TABLE "zalo_channels" ADD CONSTRAINT "zalo_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zalo_conversations" ADD CONSTRAINT "zalo_conversations_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "zalo_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
