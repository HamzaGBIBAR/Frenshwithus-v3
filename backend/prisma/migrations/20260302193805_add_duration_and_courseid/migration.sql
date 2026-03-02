-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "durationMin" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "courseId" TEXT;
