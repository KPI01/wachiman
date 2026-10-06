import { eq } from "drizzle-orm";
import { appSettings, auditLogs } from "../../../db/schema";
import { db } from "../../../db/server";

export const GLOBAL_APP_SETTINGS_ID = "global";

export class AppSettingsEntity {
  public static async getGlobal() {
    const existing = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, GLOBAL_APP_SETTINGS_ID),
      columns: {
        appLogoData: false,
        appFaviconData: false,
      },
      with: {
        updatedBy: {
          columns: { id: true, fullName: true, username: true },
        },
      },
    });
    if (existing) return existing;

    await db.insert(appSettings)
      .values({ id: GLOBAL_APP_SETTINGS_ID })
      .onConflictDoNothing();

    return db.query.appSettings.findFirst({
      where: eq(appSettings.id, GLOBAL_APP_SETTINGS_ID),
      columns: {
        appLogoData: false,
        appFaviconData: false,
      },
      with: {
        updatedBy: {
          columns: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  public static async getBrandingAsset(asset: "logo" | "favicon") {
    const [settings] = await db
      .select(
        asset === "logo"
          ? {
              data: appSettings.appLogoData,
              mimeType: appSettings.appLogoMimeType,
            }
          : {
              data: appSettings.appFaviconData,
              mimeType: appSettings.appFaviconMimeType,
            },
      )
      .from(appSettings)
      .where(eq(appSettings.id, GLOBAL_APP_SETTINGS_ID));
    return settings ?? null;
  }

  public static async updateGlobalWithAudit(input: {
    earlyArrivalToleranceMinutes?: number;
    updatedById: string;
    previousUpdatedAt: Date;
    summary: string;
    metadata: Record<string, unknown>;
    holderLegalName?: string;
    holderTaxId?: string;
    holderFiscalAddress?: string;
    appLogoData?: string | null;
    appLogoMimeType?: string | null;
    appFaviconData?: string | null;
    appFaviconMimeType?: string | null;
  }) {
    // Ensure successive updates have distinct version timestamps, even if they
    // happen during the same millisecond.
    const updatedAt = new Date(Math.max(Date.now(), input.previousUpdatedAt.getTime() + 1));
    const updateData: Partial<typeof appSettings.$inferInsert> = {
      updatedById: input.updatedById,
      updatedAt,
    };
    if (input.earlyArrivalToleranceMinutes !== undefined) {
      updateData.earlyArrivalToleranceMinutes = input.earlyArrivalToleranceMinutes;
    }
    if (input.holderLegalName !== undefined) updateData.holderLegalName = input.holderLegalName;
    if (input.holderTaxId !== undefined) updateData.holderTaxId = input.holderTaxId;
    if (input.holderFiscalAddress !== undefined) {
      updateData.holderFiscalAddress = input.holderFiscalAddress;
    }
    if (input.appLogoData !== undefined) updateData.appLogoData = input.appLogoData;
    if (input.appLogoMimeType !== undefined) {
      updateData.appLogoMimeType = input.appLogoMimeType;
    }
    if (input.appFaviconData !== undefined) {
      updateData.appFaviconData = input.appFaviconData;
    }
    if (input.appFaviconMimeType !== undefined) {
      updateData.appFaviconMimeType = input.appFaviconMimeType;
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx.update(appSettings)
        .set(updateData)
        .where(eq(appSettings.id, GLOBAL_APP_SETTINGS_ID))
        .returning();
      if (!updated) return null;
      await tx.insert(auditLogs).values({
        entityType: "AppSettings",
        entityId: GLOBAL_APP_SETTINGS_ID,
        action: "APP_SETTINGS_UPDATED",
        changedBy: input.updatedById,
        summary: input.summary,
        metadata: input.metadata,
      });
      return updated;
    });
  }
}
