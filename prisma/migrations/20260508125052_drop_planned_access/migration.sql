/*
  Warnings:

  - You are about to drop the `PlannedAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlannedAccessAudit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlannedAccessLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlannedAccessPerson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlannedAccessVehicle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlannedAccess";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlannedAccessAudit";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlannedAccessLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlannedAccessPerson";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlannedAccessVehicle";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
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
INSERT INTO "new_User" ("createdAt", "departmentId", "fullName", "id", "isActive", "isTrashed", "password", "role", "siteId", "updatedAt", "username") SELECT "createdAt", "departmentId", "fullName", "id", "isActive", "isTrashed", "password", "role", "siteId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
