-- AlterTable
ALTER TABLE "widget_configs" ADD COLUMN     "lead_form_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lead_form_title" TEXT NOT NULL DEFAULT 'Trước khi bắt đầu',
ADD COLUMN     "lead_form_description" TEXT NOT NULL DEFAULT 'Vui lòng để lại thông tin để chúng tôi tư vấn chính xác hơn.',
ADD COLUMN     "lead_form_submit_label" TEXT NOT NULL DEFAULT 'Bắt đầu chat';

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "page_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_tenant_id_created_at_idx" ON "leads"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_tenant_id_session_id_key" ON "leads"("tenant_id", "session_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
