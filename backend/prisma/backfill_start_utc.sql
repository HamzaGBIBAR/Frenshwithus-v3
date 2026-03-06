UPDATE "Course"
SET "startUtc" = (("date" || ' ' || "time")::timestamp AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'UTC'
WHERE "startUtc" IS NULL AND "date" IS NOT NULL AND "time" IS NOT NULL;
