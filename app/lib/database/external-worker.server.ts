import { and, eq, like, or, desc, ne, sql } from "drizzle-orm";
import { db } from "../../../db/server";
import {
  externalWorkers,
  companies,
  workCategories,
} from "../../../db/schema";

export type ExternalWorkerDetail = typeof externalWorkers.$inferSelect & {
  company?: typeof companies.$inferSelect;
  workCategory?: typeof workCategories.$inferSelect;
  documents?: Array<{
    id: string;
    documentType: string;
    status: string;
    fileName: string;
    filePath: string;
    expiryDate: Date;
    createdAt: Date;
  }>;
  accessLogs?: Array<{
    id: string;
    entryTimestamp: Date;
    exitTimestamp: Date | null;
    site: { id: string; name: string } | null;
    createdBy: { id: string; fullName: string; username: string } | null;
  }>;
  plannedAccessPersons?: Array<{
    id: string;
    firstNameSnapshot: string;
    lastNameSnapshot: string;
    legalIdSnapshot: string;
    plannedAccess: {
      id: string;
      expectedStartDatetime: Date;
      expectedEndDatetime: Date | null;
      status: string;
      site: { id: string; name: string } | null;
      requestedBy: { id: string; fullName: string } | null;
      approvedBy: { id: string; fullName: string } | null;
    } | null;
  }>;
};

export type ExternalWorkerListItem = typeof externalWorkers.$inferSelect & {
  company?: { id: string; name: string } | null;
  workCategory?: { id: string; name: string } | null;
};

export type CreateExternalWorkerInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  phoneNumber?: string;
  legalId: string;
  companyId: string;
  workCategoryId: string;
};

export type UpdateExternalWorkerInput = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  phoneNumber?: string;
  legalId?: string;
  companyId?: string;
  workCategoryId?: string;
};

export class ExternalWorkerEntity {
  public static async create(data: CreateExternalWorkerInput) {
    const [worker] = await db
      .insert(externalWorkers)
      .values(data)
      .returning();
    return this.findById(worker.id) as Promise<ExternalWorkerDetail>;
  }

  public static async findById(id: string): Promise<ExternalWorkerDetail | null> {
    const row = await db.query.externalWorkers.findFirst({
      where: eq(externalWorkers.id, id),
      with: {
        company: true,
        workCategory: true,
        documents: {
          orderBy: (doc, { desc: d }) => [d(doc.createdAt)],
        },
        accessLogs: {
          with: {
            site: { columns: { id: true, name: true } },
            createdBy: { columns: { id: true, fullName: true, username: true } },
          },
          orderBy: (log, { desc: d }) => [d(log.entryTimestamp)],
          limit: 50,
        },
        plannedAccessPersons: {
          with: {
            plannedAccess: {
              with: {
                site: { columns: { id: true, name: true } },
                requestedBy: { columns: { id: true, fullName: true } },
                approvedBy: { columns: { id: true, fullName: true } },
              },
            },
          },
          orderBy: (pap, { desc: d }) => [d(pap.createdAt)],
          limit: 50,
        },
      },
    });
    return row ?? null;
  }

  public static async findByLegalId(legalId: string) {
    const row = await db.query.externalWorkers.findFirst({
      where: sql`upper(${externalWorkers.legalId}) = ${legalId.trim().toUpperCase()}`,
      with: {
        company: { columns: { id: true, name: true } },
        workCategory: { columns: { id: true, name: true } },
      },
    });
    return row ?? null;
  }

  public static async findByLegalIdExcluding(legalId: string, excludedId: string) {
    const row = await db
      .select()
      .from(externalWorkers)
      .where(
        and(
          eq(externalWorkers.legalId, legalId),
          ne(externalWorkers.id, excludedId),
        ),
      )
      .get();
    return row ?? null;
  }

  public static async findMany(): Promise<ExternalWorkerListItem[]> {
    const rows = await db.query.externalWorkers.findMany({
      orderBy: (worker, { desc: d }) => [d(worker.createdAt)],
      with: {
        company: { columns: { id: true, name: true } },
        workCategory: { columns: { id: true, name: true } },
      },
    });
    return rows;
  }

  public static async search(query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const searchTerm = `%${normalizedQuery}%`;
    const rows = await db.query.externalWorkers.findMany({
      where: or(
        like(externalWorkers.legalId, searchTerm),
        like(externalWorkers.firstName, searchTerm),
        like(externalWorkers.lastName, searchTerm),
      ),
      with: {
        company: { columns: { id: true, name: true } },
        workCategory: { columns: { id: true, name: true } },
      },
      limit: 5,
      orderBy: (worker, { desc: d }) => [d(worker.createdAt)],
    });
    return rows;
  }

  public static async update(id: string, data: UpdateExternalWorkerInput) {
    const [worker] = await db
      .update(externalWorkers)
      .set(data)
      .where(eq(externalWorkers.id, id))
      .returning();
    return this.findById(worker.id) as Promise<ExternalWorkerListItem>;
  }

  public static async delete(id: string) {
    const [worker] = await db
      .delete(externalWorkers)
      .where(eq(externalWorkers.id, id))
      .returning();
    return worker;
  }
}
