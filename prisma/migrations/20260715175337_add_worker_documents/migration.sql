-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IDENTIFICATION', 'TRAINING');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('VALIDATED', 'EXPIRED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "WorkCategory" ADD COLUMN     "requiresTraining" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'VALIDATED',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "externalWorkerId" TEXT NOT NULL,

    CONSTRAINT "WorkerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerDocument_externalWorkerId_idx" ON "WorkerDocument"("externalWorkerId");

-- CreateIndex
CREATE INDEX "WorkerDocument_status_expiryDate_idx" ON "WorkerDocument"("status", "expiryDate");

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_externalWorkerId_fkey" FOREIGN KEY ("externalWorkerId") REFERENCES "ExternalWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
