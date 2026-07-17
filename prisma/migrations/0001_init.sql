-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");
CREATE INDEX "Department_slug_idx" ON "Department"("slug");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "isTrashed" BOOLEAN DEFAULT false,
    "role" TEXT DEFAULT 'ACCESS_OPERATOR',
    "siteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateTable
CREATE TABLE "AccessLogVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "plateSnapshot" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT NOT NULL DEFAULT '',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "slug" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_slug_idx" ON "Company"("slug");

-- CreateTable
CREATE TABLE "WorkCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresSpecialPermission" BOOLEAN NOT NULL DEFAULT false,
    "requiresTraining" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ExternalWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "secondLastName" TEXT,
    "phoneNumber" TEXT,
    "legalId" TEXT NOT NULL,
    "workCategoryId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "ExternalWorker_workCategoryId_fkey" FOREIGN KEY ("workCategoryId") REFERENCES "WorkCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalWorker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalWorker_legalId_key" ON "ExternalWorker"("legalId");
CREATE INDEX "ExternalWorker_legalId_idx" ON "ExternalWorker"("legalId");
CREATE INDEX "ExternalWorker_companyId_idx" ON "ExternalWorker"("companyId");
CREATE INDEX "ExternalWorker_workCategoryId_idx" ON "ExternalWorker"("workCategoryId");

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VALIDATED',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "expiryDate" DATETIME NOT NULL,
    "notes" TEXT,
    "externalWorkerId" TEXT NOT NULL,
    CONSTRAINT "WorkerDocument_externalWorkerId_fkey" FOREIGN KEY ("externalWorkerId") REFERENCES "ExternalWorker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkerDocument_externalWorkerId_idx" ON "WorkerDocument"("externalWorkerId");
CREATE INDEX "WorkerDocument_status_expiryDate_idx" ON "WorkerDocument"("status", "expiryDate");

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

-- CreateIndex
CREATE INDEX "PlannedAccess_status_siteId_idx" ON "PlannedAccess"("status", "siteId");
CREATE INDEX "PlannedAccess_expectedStartDatetime_expectedEndDatetime_idx" ON "PlannedAccess"("expectedStartDatetime", "expectedEndDatetime");

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
    "externalWorkerId" TEXT,
    CONSTRAINT "PlannedAccessPerson_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccessPerson_externalWorkerId_fkey" FOREIGN KEY ("externalWorkerId") REFERENCES "ExternalWorker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlannedAccessPerson_legalIdSnapshot_idx" ON "PlannedAccessPerson"("legalIdSnapshot");
CREATE INDEX "PlannedAccessPerson_plannedAccessId_idx" ON "PlannedAccessPerson"("plannedAccessId");

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryTimestamp" DATETIME NOT NULL,
    "entrySignatureEnvelope" TEXT NOT NULL,
    "exitTimestamp" DATETIME,
    "exitSignatureEnvelope" TEXT,
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
    "externalWorkerId" TEXT,
    CONSTRAINT "AccessLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_exitRecordedById_fkey" FOREIGN KEY ("exitRecordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_vehicleAccessLogId_fkey" FOREIGN KEY ("vehicleAccessLogId") REFERENCES "AccessLogVehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_plannedAccessId_fkey" FOREIGN KEY ("plannedAccessId") REFERENCES "PlannedAccess" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_plannedAccessPersonId_fkey" FOREIGN KEY ("plannedAccessPersonId") REFERENCES "PlannedAccessPerson" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_externalWorkerId_fkey" FOREIGN KEY ("externalWorkerId") REFERENCES "ExternalWorker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" TEXT
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_changedBy_idx" ON "AuditLog"("changedBy");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
