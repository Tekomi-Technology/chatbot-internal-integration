-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "tenant_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "api_key_type" AS ENUM ('PUBLIC', 'ADMIN');

-- CreateEnum
CREATE TYPE "widget_mode" AS ENUM ('BUBBLE', 'INLINE');

-- CreateEnum
CREATE TYPE "widget_position" AS ENUM ('BOTTOM_RIGHT', 'BOTTOM_LEFT');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "tenant_status" NOT NULL DEFAULT 'ACTIVE',
    "dify_app_id" TEXT NOT NULL,
    "dify_api_key_encrypted" TEXT NOT NULL,
    "dify_api_base_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key_value" TEXT NOT NULL,
    "label" TEXT,
    "type" "api_key_type" NOT NULL DEFAULT 'PUBLIC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_whitelists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_whitelists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mode" "widget_mode" NOT NULL DEFAULT 'BUBBLE',
    "bot_name" TEXT NOT NULL DEFAULT 'Trợ lý AI',
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#4F46E5',
    "welcome_message" TEXT NOT NULL DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn?',
    "input_placeholder" TEXT NOT NULL DEFAULT 'Nhập câu hỏi của bạn...',
    "position" "widget_position" NOT NULL DEFAULT 'BOTTOM_RIGHT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "dify_conversation_id" TEXT,
    "request_payload" JSONB NOT NULL,
    "response_payload" JSONB NOT NULL,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_value_key" ON "api_keys"("key_value");

-- CreateIndex
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys"("tenant_id");

-- CreateIndex
CREATE INDEX "domain_whitelists_tenant_id_idx" ON "domain_whitelists"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "domain_whitelists_tenant_id_domain_key" ON "domain_whitelists"("tenant_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "widget_configs_tenant_id_key" ON "widget_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "conversation_logs_tenant_id_created_at_idx" ON "conversation_logs"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_whitelists" ADD CONSTRAINT "domain_whitelists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_logs" ADD CONSTRAINT "conversation_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
