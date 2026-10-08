import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllowedAreaEntity } from "../app/lib/database/allowed-area.server";
import { SiteEntity } from "../app/lib/database/site.server";
import { UserEntity } from "../app/lib/database/user.server";
import { AccessLogEntity } from "../app/lib/database/access-log.server";
import { createAllowedArea, deleteAllowedArea, getManyAllowedAreas, updateAllowedArea } from "../app/lib/services/allowed-area.server";
import { createAccessLog, updateAccessLog } from "../app/lib/services/access-log.server";
import { createPlannedAccessSchema, updatePlannedAccessSchema } from "../app/lib/schemas/planned-access";

const area = { id: "area-1", siteId: "site-1", name: "Almacén", slug: "ALMACEN" };
const visitor = { firstNameSnapshot: "Ana", lastNameSnapshot: "García", legalIdSnapshot: "12345678Z", allowedAreaSnapshot: "Almacén", allowedAreaId: area.id };
const plannedInput = { siteId: "site-1", companySnapshot: "Empresa", visitReason: "Visita", expectedStartDatetime: "2026-10-09T12:00:00Z", persons: [visitor] };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(SiteEntity, "findById").mockResolvedValue({ id: "site-1" } as never);
  vi.spyOn(AllowedAreaEntity, "findById").mockResolvedValue(area as never);
  vi.spyOn(AllowedAreaEntity, "findBySlug").mockResolvedValue(null);
  vi.spyOn(AllowedAreaEntity, "create").mockResolvedValue(area as never);
  vi.spyOn(AllowedAreaEntity, "update").mockResolvedValue(area as never);
  vi.spyOn(AllowedAreaEntity, "delete").mockResolvedValue(area as never);
  vi.spyOn(UserEntity, "getByUsername").mockResolvedValue({ id: "user-1" } as never);
});

describe("áreas por centro", () => {
  it("exige seleccionar un centro existente", async () => {
    expect(await createAllowedArea({ name: area.name })).toMatchObject({ success: false });
    vi.mocked(SiteEntity.findById).mockResolvedValue(null);
    expect(await createAllowedArea({ name: area.name, siteId: "missing" })).toMatchObject({ success: false });
    expect(AllowedAreaEntity.create).not.toHaveBeenCalled();
  });

  it("comprueba duplicados dentro del centro y permite el mismo nombre en otro", async () => {
    expect(await createAllowedArea({ name: area.name, siteId: "site-2" })).toMatchObject({ success: true });
    expect(AllowedAreaEntity.findBySlug).toHaveBeenCalledWith("site-2", "ALMACEN");
    expect(AllowedAreaEntity.create).toHaveBeenCalledWith({ name: area.name, siteId: "site-2", slug: "ALMACEN" });
    vi.mocked(AllowedAreaEntity.findBySlug).mockResolvedValue(area as never);
    expect(await createAllowedArea({ name: area.name, siteId: "site-1" })).toMatchObject({ success: false });
  });

  it("valida duplicados al renombrar sin trasladar el área a otro centro", async () => {
    expect(await updateAllowedArea({ id: area.id, name: "Oficina", siteId: "site-2" })).toMatchObject({ success: true });
    expect(AllowedAreaEntity.findBySlug).toHaveBeenCalledWith("site-1", "OFICINA", area.id);
    expect(AllowedAreaEntity.update).toHaveBeenCalledWith(area.id, { name: "Oficina", slug: "OFICINA" });
  });

  it("presenta un error de campo si otra petición crea el mismo nombre simultáneamente", async () => {
    vi.mocked(AllowedAreaEntity.create).mockRejectedValue({ cause: { code: "23505" } });
    expect(await createAllowedArea({ name: area.name, siteId: area.siteId })).toMatchObject({
      success: false, errors: { properties: { name: { errors: [expect.stringContaining("Ya existe")] } } },
    });
  });

  it("impide crear, editar y borrar áreas de otro centro en un catálogo restringido", async () => {
    expect(await createAllowedArea({ name: "Otra", siteId: "site-2" }, "site-1")).toMatchObject({ success: false });
    expect(await updateAllowedArea({ id: area.id, name: "Otra" }, "site-2")).toMatchObject({ success: false });
    expect(await deleteAllowedArea({ id: area.id }, "site-2")).toMatchObject({ success: false });
    expect(AllowedAreaEntity.create).not.toHaveBeenCalled();
    expect(AllowedAreaEntity.update).not.toHaveBeenCalled();
    expect(AllowedAreaEntity.delete).not.toHaveBeenCalled();
  });

  it("filtra el catálogo por centro", async () => {
    vi.spyOn(AllowedAreaEntity, "findMany").mockResolvedValue([]);
    await getManyAllowedAreas("site-1");
    expect(AllowedAreaEntity.findMany).toHaveBeenCalledWith("site-1");
  });

  it("rechaza áreas de otra planta al crear y editar solicitudes", async () => {
    expect((await createPlannedAccessSchema.safeParseAsync(plannedInput)).success).toBe(true);
    vi.mocked(AllowedAreaEntity.findById).mockResolvedValue({ ...area, siteId: "site-2" } as never);
    expect((await createPlannedAccessSchema.safeParseAsync(plannedInput)).success).toBe(false);
    expect((await updatePlannedAccessSchema.safeParseAsync({ ...plannedInput, id: "request-1", expectedUpdatedAt: new Date() })).success).toBe(false);
    expect((await createPlannedAccessSchema.safeParseAsync({ ...plannedInput, persons: [{ ...visitor, allowedAreaId: "" }] })).success).toBe(true);
  });

  it("rechaza áreas ajenas al centro efectivo al registrar y editar ingresos", async () => {
    const input = { ...visitor, entryTimestamp: "2026-10-08T08:00:00Z", entrySignaturePayload: JSON.stringify({ strokes: [[[1, 1], [2, 2]]] }),
      riskInformationAcknowledged: "true", companyId: "company-1", companyNameSnapshot: "Empresa", siteId: "site-1", approvedBySnapshot: "Supervisor", visitReason: "Visita" };
    expect(await createAccessLog(input, { authorUsername: "usuario", lockedSiteId: "site-2" })).toMatchObject({ success: false, errors: expect.stringContaining("centro") });
    vi.spyOn(AccessLogEntity, "findFirst").mockResolvedValue({ id: "log-1", siteId: "site-2" } as never);
    expect(await updateAccessLog({ ...input, expectedEntryTimestamp: input.entryTimestamp }, "log-1", { authorUsername: "usuario" }))
      .toMatchObject({ success: false, errors: expect.stringContaining("centro") });
  });
});
