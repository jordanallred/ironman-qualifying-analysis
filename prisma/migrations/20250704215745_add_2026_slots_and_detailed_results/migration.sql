-- AlterTable
ALTER TABLE "qualifying_analysis" ADD COLUMN "detailed_results" JSONB;

-- AlterTable
ALTER TABLE "races" ADD COLUMN "men_slots_2026" INTEGER;
ALTER TABLE "races" ADD COLUMN "total_slots_2026" INTEGER;
ALTER TABLE "races" ADD COLUMN "women_slots_2026" INTEGER;
