-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCESS_OPERATOR', 'ACCESS_MONITOR', 'SECURITY_MANAGER', 'ACCESS_APPROVER', 'ACCESS_REQUESTER');

-- CreateEnum
CREATE TYPE "PlannedAccessStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELED', 'EXPIRED', 'USED', 'PARTIALLY_USED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "isTrashed" BOOLEAN DEFAULT false,
    "role" "UserRole" DEFAULT 'ACCESS_OPERATOR',
    "siteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "entryTimestamp" TIMESTAMP(3) NOT NULL,
    "entrySignatureEnvelope" JSONB NOT NULL,
    "exitTimestamp" TIMESTAMP(3),
    "exitSignatureEnvelope" JSONB,
    "companyNameSnapshot" TEXT NOT NULL,
    "firstNameSnapshot" TEXT NOT NULL,
    "middleNameSnapshot" TEXT,
    "lastNameSnapshot" TEXT NOT NULL,
    "secondLastNameSnapshot" TEXT,
    "phoneNumber" TEXT,
    "legalIdSnapshot" TEXT NOT NULL,
    "withVehicle" BOOLEAN NOT NULL DEFAULT false,
    "visitReason" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "exitRecordedById" TEXT,
    "vehicleAccessLogId" TEXT,
    "plannedAccessId" TEXT,
    "plannedAccessPersonId" TEXT,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLogVehicle" (
    "id" TEXT NOT NULL,
    "typeSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "plateSnapshot" TEXT NOT NULL,

    CONSTRAINT "AccessLogVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedAccess" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedStartDatetime" TIMESTAMP(3) NOT NULL,
    "expectedEndDatetime" TIMESTAMP(3),
    "status" "PlannedAccessStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "companySnapshot" TEXT NOT NULL,
    "visitReason" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "PlannedAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedAccessPerson" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plannedAccessId" TEXT NOT NULL,
    "firstNameSnapshot" TEXT NOT NULL,
    "middleNameSnapshot" TEXT,
    "lastNameSnapshot" TEXT NOT NULL,
    "secondLastNameSnapshot" TEXT,
    "phoneNumber" TEXT,
    "legalIdSnapshot" TEXT NOT NULL,

    CONSTRAINT "PlannedAccessPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE INDEX "Department_slug_idx" ON "Department"("slug");

-- CreateIndex
CREATE INDEX "PlannedAccess_status_siteId_idx" ON "PlannedAccess"("status", "siteId");

-- CreateIndex
CREATE INDEX "PlannedAccess_expectedStartDatetime_expectedEndDatetime_idx" ON "PlannedAccess"("expectedStartDatetime", "expectedEndDatetime");

-- CreateIndex
CREATE INDEX "PlannedAccessPerson_legalIdSnapshot_idx" ON "PlannedAccessPerson"("legalIdSnapshot");

-- CreateIndex
CREATE INDEX "PlannedAccessPerson_plannedAccessId_idx" ON "PlannedAccessPerson"("plannedAccessId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_exitRecordedById_fkey" FOREIGN KEY ("exitRecordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_vehicleAccessLogId_fkey" FOREIGN KEY ("vehicleAccessLogId") REFERENCES "AccessLogVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_plannedAccessPersonId_fkey" FOREIGN KEY ("plannedAccessPersonId") REFERENCES "PlannedAccessPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedAccess" ADD CONSTRAINT "PlannedAccess_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedAccess" ADD CONSTRAINT "PlannedAccess_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedAccess" ADD CONSTRAINT "PlannedAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedAccessPerson" ADD CONSTRAINT "PlannedAccessPerson_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
