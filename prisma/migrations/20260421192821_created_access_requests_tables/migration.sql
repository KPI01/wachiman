-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expectedStartDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AccessRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessLogId" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "accessRequestPersonId" TEXT NOT NULL,
    "accessRequestVehicleId" TEXT NOT NULL,
    CONSTRAINT "AccessRequestLog_accessLogId_fkey" FOREIGN KEY ("accessLogId") REFERENCES "AccessLog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessRequestLog_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessRequestLog_accessRequestPersonId_fkey" FOREIGN KEY ("accessRequestPersonId") REFERENCES "AccessRequestPerson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessRequestLog_accessRequestVehicleId_fkey" FOREIGN KEY ("accessRequestVehicleId") REFERENCES "AccessRequestVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessRequestPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstNameSnapshot" TEXT NOT NULL,
    "middleNameSnapshot" TEXT,
    "lastNameSnapshot" TEXT NOT NULL,
    "secondLastNameSnapshot" TEXT,
    "legalIdSnapshot" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    CONSTRAINT "AccessRequestPerson_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessRequestVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "typeSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "plateSnapshot" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    CONSTRAINT "AccessRequestVehicle_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
