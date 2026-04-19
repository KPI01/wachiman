-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryTimestamp" DATETIME NOT NULL,
    "entrySignatureEnvelope" JSONB NOT NULL,
    "exitTimestamp" DATETIME,
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
    CONSTRAINT "AccessLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_exitRecordedById_fkey" FOREIGN KEY ("exitRecordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessLog_vehicleAccessLogId_fkey" FOREIGN KEY ("vehicleAccessLogId") REFERENCES "AccessLogVehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccessLog" ("companyNameSnapshot", "createdById", "entrySignatureEnvelope", "entryTimestamp", "exitRecordedById", "exitSignatureEnvelope", "exitTimestamp", "firstNameSnapshot", "id", "lastNameSnapshot", "legalIdSnapshot", "middleNameSnapshot", "phoneNumber", "secondLastNameSnapshot", "siteId", "vehicleAccessLogId", "visitReason", "withVehicle") SELECT "companyNameSnapshot", "createdById", "entrySignatureEnvelope", "entryTimestamp", "exitRecordedById", "exitSignatureEnvelope", "exitTimestamp", "firstNameSnapshot", "id", "lastNameSnapshot", "legalIdSnapshot", "middleNameSnapshot", "phoneNumber", "secondLastNameSnapshot", "siteId", "vehicleAccessLogId", "visitReason", "withVehicle" FROM "AccessLog";
DROP TABLE "AccessLog";
ALTER TABLE "new_AccessLog" RENAME TO "AccessLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
