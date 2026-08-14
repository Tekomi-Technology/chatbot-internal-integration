-- Gỡ toàn bộ tính năng thu thập lead: bảng leads và các cột cấu hình form.
DROP TABLE "leads";

ALTER TABLE "widget_configs"
  DROP COLUMN "lead_form_enabled",
  DROP COLUMN "lead_form_title",
  DROP COLUMN "lead_form_description",
  DROP COLUMN "lead_form_submit_label",
  DROP COLUMN "lead_form_name_label",
  DROP COLUMN "lead_form_phone_label",
  DROP COLUMN "lead_form_fields";
