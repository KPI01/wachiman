import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client";

export function createLocalPrismaClient(dbUrl = "file:./prisma/dev.db") {
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter });
}
