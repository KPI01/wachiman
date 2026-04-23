/*
  Warnings:

  - You are about to drop the `AccessRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessRequestLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessRequestPerson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessRequestVehicle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccessRequest";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccessRequestLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccessRequestPerson";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccessRequestVehicle";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PlannedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expectedStartDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" DATETIME,
    "approvedById" TEXT NOT NULL,
    CONSTRAINT "PlannedAccess_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedAccessAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedAccessId" TEXT NOT NULL,
    "madeById" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    CONSTRAINT "PlannedAccessAudit_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccessAudit_madeById_fkey" FOREIGN KEY ("madeById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessLogId" TEXT NOT NULL,
    "plannedAccessId" TEXT NOT NULL,
    "plannedAccessPersonId" TEXT NOT NULL,
    "plannedAccessVehicleId" TEXT NOT NULL,
    CONSTRAINT "PlannedAccessLog_accessLogId_fkey" FOREIGN KEY ("accessLogId") REFERENCES "AccessLog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccessLog_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccessLog_plannedAccessPersonId_fkey" FOREIGN KEY ("plannedAccessPersonId") REFERENCES "PlannedAccessPerson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccessLog_plannedAccessVehicleId_fkey" FOREIGN KEY ("plannedAccessVehicleId") REFERENCES "PlannedAccessVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedAccessPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstNameSnapshot" TEXT NOT NULL,
    "middleNameSnapshot" TEXT,
    "lastNameSnapshot" TEXT NOT NULL,
    "secondLastNameSnapshot" TEXT,
    "legalIdSnapshot" TEXT NOT NULL,
    "plannedAccessId" TEXT NOT NULL,
    CONSTRAINT "PlannedAccessPerson_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedAccessVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "typeSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "plateSnapshot" TEXT NOT NULL,
    "plannedAccessId" TEXT NOT NULL,
    CONSTRAINT "PlannedAccessVehicle_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
