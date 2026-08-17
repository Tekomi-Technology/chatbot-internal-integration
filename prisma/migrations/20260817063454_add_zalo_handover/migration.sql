-- AlterTable
ALTER TABLE "zalo_channels" ADD COLUMN     "night_resume_end_hour" INTEGER,
ADD COLUMN     "night_resume_start_hour" INTEGER;

-- AlterTable
ALTER TABLE "zalo_conversations" ADD COLUMN     "handover_at" TIMESTAMP(3),
ADD COLUMN     "human_active" BOOLEAN NOT NULL DEFAULT false;
