import { and, eq } from "drizzle-orm";
import { appSettings, auditLogs } from "../../../db/schema";
import { db } from "../../../db/server";

export const GLOBAL_APP_SETTINGS_ID = "global";

export class AppSettingsEntity {
  public static async getGlobal() {
    return db.query.appSettings.findFirst({
      where: eq(appSettings.id, GLOBAL_APP_SETTINGS_ID),
      with: {
        updatedBy: {
          columns: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  public static async updateGlobalWithAudit(input: {
    earlyArrivalToleranceMinutes: number;
    updatedById: string;
    expectedUpdatedAt?: Date;
    summary: string;
    metadata: Record<string, unknown>;
    holderLegalName: string;
    holderTaxId: string;
    holderFiscalAddress: string;
  }) {
    const updatedAt = new Date();
    const updateData = {
      earlyArrivalToleranceMinutes: input.earlyArrivalToleranceMinutes,
      updatedById: input.updatedById,
      updatedAt,
      holderLegalName: input.holderLegalName,
      holderTaxId: input.holderTaxId,
      holderFiscalAddress: input.holderFiscalAddress,
    };
    const where = input.expectedUpdatedAt
      ? and(
          eq(appSettings.id, GLOBAL_APP_SETTINGS_ID),
          eq(appSettings.updatedAt, input.expectedUpdatedAt),
        )
      : eq(appSettings.id, GLOBAL_APP_SETTINGS_ID);

    return db.transaction((tx) => {
      const [updated] = tx.update(appSettings).set(updateData).where(where).returning().all();
      if (!updated) return null;
      tx.insert(auditLogs).values({
        entityType: "AppSettings",
        entityId: GLOBAL_APP_SETTINGS_ID,
        action: "APP_SETTINGS_UPDATED",
        changedBy: input.updatedById,
        summary: input.summary,
        metadata: input.metadata,
      }).run();
      return updated;
    });
  }
}
