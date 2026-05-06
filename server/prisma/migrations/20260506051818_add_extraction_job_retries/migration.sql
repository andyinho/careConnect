-- AlterTable
ALTER TABLE "ExtractionJob" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3;
