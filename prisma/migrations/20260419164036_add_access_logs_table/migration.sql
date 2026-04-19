-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryTimestamp" DATETIME NOT NULL,
    "exitTimestamp" DATETIME,
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
    "vehicleAccessLogId" TEXT NOT NULL,
    CONSTRAINT "AccessLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_vehicleAccessLogId_fkey" FOREIGN KEY ("vehicleAccessLogId") REFERENCES "AccessLogVehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessLogVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "plateSnapshot" TEXT NOT NULL
);
