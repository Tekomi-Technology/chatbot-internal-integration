-- AlterTable
ALTER TABLE "messenger_conversations" ADD COLUMN     "human_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handover_at" TIMESTAMP(3);
