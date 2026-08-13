-- AlterTable
ALTER TABLE "widget_configs" ADD COLUMN     "lead_form_name_label" TEXT NOT NULL DEFAULT 'Họ và tên',
ADD COLUMN     "lead_form_phone_label" TEXT NOT NULL DEFAULT 'Số điện thoại',
ADD COLUMN     "lead_form_fields" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "extra" JSONB NOT NULL DEFAULT '{}';
