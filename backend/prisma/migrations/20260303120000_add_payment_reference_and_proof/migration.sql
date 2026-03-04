-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "reference" TEXT;
ALTER TABLE "Payment" ADD COLUMN "proofUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "proofUploadedAt" TIMESTAMP(3);

-- Backfill reference for existing rows
UPDATE "Payment" SET "reference" = 'FWU-LEGACY-' || "id" WHERE "reference" IS NULL;

-- Make reference required and unique
ALTER TABLE "Payment" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
