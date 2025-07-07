-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "total_slots" INTEGER NOT NULL,
    "men_slots" INTEGER,
    "women_slots" INTEGER,
    "total_slots_2026" INTEGER,
    "men_slots_2026" INTEGER,
    "women_slots_2026" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
    "id" TEXT NOT NULL,
    "race_id" TEXT NOT NULL,
    "athlete_name" TEXT NOT NULL,
    "age_group" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "finish_time" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "country" TEXT,
    "time_seconds" INTEGER,
    "age_graded_time" INTEGER,

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifying_analysis" (
    "id" TEXT NOT NULL,
    "race_id" TEXT NOT NULL,
    "total_participants" INTEGER NOT NULL,
    "men_participants" INTEGER NOT NULL,
    "women_participants" INTEGER NOT NULL,
    "total_slots" INTEGER NOT NULL,
    "system_2025_men_qualified" INTEGER NOT NULL,
    "system_2025_women_qualified" INTEGER NOT NULL,
    "system_2025_total_qualified" INTEGER NOT NULL,
    "system_2026_men_qualified" INTEGER NOT NULL,
    "system_2026_women_qualified" INTEGER NOT NULL,
    "system_2026_total_qualified" INTEGER NOT NULL,
    "men_difference" INTEGER NOT NULL,
    "women_difference" INTEGER NOT NULL,
    "age_group_analysis" JSONB NOT NULL,
    "detailed_results" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qualifying_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_group_standards" (
    "id" TEXT NOT NULL,
    "age_group" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "age_group_standards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "races_name_key" ON "races"("name");

-- CreateIndex
CREATE UNIQUE INDEX "qualifying_analysis_race_id_key" ON "qualifying_analysis"("race_id");

-- CreateIndex
CREATE UNIQUE INDEX "age_group_standards_age_group_key" ON "age_group_standards"("age_group");

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_analysis" ADD CONSTRAINT "qualifying_analysis_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
