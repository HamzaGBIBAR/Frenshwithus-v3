-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "startUtc" TIMESTAMP(3);

-- Backfill: interpret existing date+time as Morocco and set startUtc (UTC)
UPDATE "Course"
SET "startUtc" = (("date" || ' ' || "time")::timestamp AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'UTC'
WHERE "startUtc" IS NULL AND "date" IS NOT NULL AND "time" IS NOT NULL;
