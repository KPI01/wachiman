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

-- CreateIndex
CREATE INDEX "Department_slug_idx" ON "Department"("slug");

-- Seed a default department for existing users
INSERT INTO "Department" ("id", "updatedAt", "name", "slug")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    'General',
    'GENERAL'
);

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
    "role" TEXT DEFAULT 'ACCESS_REQUESTER',
    "siteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" (
    "createdAt",
    "fullName",
    "id",
    "isActive",
    "isTrashed",
    "password",
    "role",
    "updatedAt",
    "username",
    "siteId",
    "departmentId"
)
SELECT
    "createdAt",
    "fullName",
    "id",
    "isActive",
    "isTrashed",
    "password",
    "role",
    "updatedAt",
    "username",
    "siteId",
    '00000000-0000-0000-0000-000000000001'
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
