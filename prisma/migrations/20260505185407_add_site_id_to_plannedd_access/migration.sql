/*
  Warnings:

  - Added the required column `siteId` to the `PlannedAccess` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlannedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expectedStartDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" DATETIME,
    "siteId" TEXT NOT NULL,
    "approvedById" TEXT,
    CONSTRAINT "PlannedAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlannedAccess_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlannedAccess" ("approvedAt", "approvedById", "createdAt", "expectedEndDate", "expectedStartDate", "id", "status", "updatedAt") SELECT "approvedAt", "approvedById", "createdAt", "expectedEndDate", "expectedStartDate", "id", "status", "updatedAt" FROM "PlannedAccess";
DROP TABLE "PlannedAccess";
ALTER TABLE "new_PlannedAccess" RENAME TO "PlannedAccess";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
