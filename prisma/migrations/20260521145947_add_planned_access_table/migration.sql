-- CreateTable
CREATE TABLE "PlannedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expectedStartDatetime" DATETIME NOT NULL,
    "expectedEndDatetime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "companySnapshot" TEXT NOT NULL,
    "visitReason" TEXT NOT NULL,
    "approvedAt" DATETIME,
    "approvedById" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    CONSTRAINT "PlannedAccess_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccess_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedAccessPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "plannedAccessId" TEXT NOT NULL,
    "firstNameSnapshot" TEXT NOT NULL,
    "middleNameSnapshot" TEXT,
    "lastNameSnapshot" TEXT NOT NULL,
    "secondLastNameSnapshot" TEXT,
    "phoneNumber" TEXT,
    "legalIdSnapshot" TEXT NOT NULL,
    CONSTRAINT "PlannedAccessPerson_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlannedAccess_status_siteId_idx" ON "PlannedAccess"("status", "siteId");

-- CreateIndex
CREATE INDEX "PlannedAccess_expectedStartDatetime_expectedEndDatetime_idx" ON "PlannedAccess"("expectedStartDatetime", "expectedEndDatetime");

-- CreateIndex
CREATE INDEX "PlannedAccessPerson_legalIdSnapshot_idx" ON "PlannedAccessPerson"("legalIdSnapshot");

-- CreateIndex
CREATE INDEX "PlannedAccessPerson_plannedAccessId_idx" ON "PlannedAccessPerson"("plannedAccessId");
