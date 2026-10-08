import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeCompanyName } from "../app/lib/company-name";
import { CompanyEntity } from "../app/lib/database/company.server";
import { PlannedAccessEntity } from "../app/lib/database/planned-access.server";
import { UserEntity } from "../app/lib/database/user.server";
import { SiteEntity } from "../app/lib/database/site.server";
import { AllowedAreaEntity } from "../app/lib/database/allowed-area.server";
import { WorkCategoryEntity } from "../app/lib/database/work-category.server";
import { ExternalWorkerEntity } from "../app/lib/database/external-worker.server";
import { AuditLogEntity } from "../app/lib/database/audit-log.server";
import { resolvePlannedAccessCompany } from "../app/lib/services/company.server";
import {
  createPlannedAccess,
  updatePlannedAccess,
  updatePlannedAccessStatus,
  validatePlannedAccessCompany,
} from "../app/lib/services/planned-access.server";
import { createAndApproveWorkPermitActivity } from "../app/lib/services/work-permit.server";

const company = { id: "company-1", name: "Empresa Prueba S.L.", slug: "PRUEBA", cif: "B12345678" };
const person = {
  id: "person-1", firstNameSnapshot: "Ana", lastNameSnapshot: "García", legalIdSnapshot: "12345678Z",
  allowedAreaSnapshot: "Almacén", allowedAreaId: "area-1",
};
const pending = {
  id: "request-1", companyId: null, companySnapshot: "Empresa Prueeva", siteId: "site-1",
  departmentId: "dept-1", requestedById: "user-1", status: "PENDING_APPROVAL",
  updatedAt: new Date("2026-10-08T12:00:00Z"), plannedAccessPersons: [person],
};
const input = {
  siteId: "site-1", companySnapshot: "Empresa Prueeva", companyId: "", visitReason: "Mantenimiento",
  expectedStartDatetime: "2026-10-09T12:00:00Z", persons: [person],
};
const options = { authorUsername: "usuario", canApprove: true };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(CompanyEntity, "findNameMatches").mockResolvedValue([]);
  vi.spyOn(CompanyEntity, "findById").mockResolvedValue(company as never);
  vi.spyOn(CompanyEntity, "findBySlug").mockResolvedValue(null);
  vi.spyOn(CompanyEntity, "create").mockResolvedValue(company as never);
  vi.spyOn(CompanyEntity, "findOrCreateByName").mockResolvedValue(company as never);
  vi.spyOn(UserEntity, "getByUsername").mockResolvedValue({ id: "user-1", role: "ADMIN", departmentId: "dept-1" } as never);
  vi.spyOn(SiteEntity, "findById").mockResolvedValue({ id: "site-1" } as never);
  vi.spyOn(AllowedAreaEntity, "findById").mockResolvedValue({ id: "area-1" } as never);
  vi.spyOn(PlannedAccessEntity, "findOverlappingPlannedAccess").mockResolvedValue([]);
  vi.spyOn(PlannedAccessEntity, "findOverlappingForPerson").mockResolvedValue([]);
  vi.spyOn(PlannedAccessEntity, "findById").mockResolvedValue(pending as never);
  vi.spyOn(PlannedAccessEntity, "create").mockResolvedValue(pending as never);
  vi.spyOn(PlannedAccessEntity, "updatePending").mockResolvedValue({ kind: "updated", id: pending.id });
  vi.spyOn(PlannedAccessEntity, "validateCompany").mockResolvedValue({ ...pending, companyId: company.id, companySnapshot: company.name } as never);
  vi.spyOn(PlannedAccessEntity, "approve").mockResolvedValue({ ...pending, companyId: company.id } as never);
  vi.spyOn(AuditLogEntity, "create").mockResolvedValue({} as never);
});

describe("empresas en solicitudes de acceso", () => {
  it("reconoce diferencias de mayúsculas, tildes, espacios y puntos, pero conserva errores ortográficos", () => {
    expect(normalizeCompanyName("  TÉCNICA   S.L. ")).toBe(normalizeCompanyName("tecnica sl"));
    expect(normalizeCompanyName("Empresa Prueeva")).not.toBe(normalizeCompanyName("Empresa Prueba"));
  });

  it("asocia una coincidencia única sin seleccionar sugerencias", async () => {
    vi.mocked(CompanyEntity.findNameMatches).mockResolvedValue([company] as never);
    expect(await createPlannedAccess({ ...input, companySnapshot: "empresa prueba s.l." }, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.create).toHaveBeenCalledWith(expect.objectContaining({ companyId: company.id, companySnapshot: company.name }));
  });

  it("envía una empresa desconocida sin crear registros provisionales", async () => {
    expect(await createPlannedAccess(input, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.create).toHaveBeenCalledWith(expect.objectContaining({ companyId: null, companySnapshot: input.companySnapshot }));
    expect(CompanyEntity.create).not.toHaveBeenCalled();
    expect(CompanyEntity.findOrCreateByName).not.toHaveBeenCalled();
  });

  it("no elige arbitrariamente entre empresas con nombres equivalentes", async () => {
    vi.mocked(CompanyEntity.findNameMatches).mockResolvedValue([company, { ...company, id: "company-2" }] as never);
    expect(await resolvePlannedAccessCompany(company.name)).toMatchObject({ companyId: null });
    expect(await resolvePlannedAccessCompany(company.name, company.id)).toMatchObject({ companyId: company.id });
  });

  it("usa el nombre del catálogo para una selección explícita", async () => {
    expect(await createPlannedAccess({ ...input, companyId: company.id }, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.create).toHaveBeenCalledWith(expect.objectContaining({ companyId: company.id, companySnapshot: company.name }));
  });

  it("rechaza un identificador de empresa inexistente", async () => {
    vi.mocked(CompanyEntity.findById).mockResolvedValue(null);
    expect(await createPlannedAccess({ ...input, companyId: "missing" }, options)).toMatchObject({ success: false });
    expect(PlannedAccessEntity.create).not.toHaveBeenCalled();
  });

  it("permite editar una solicitud con empresa pendiente", async () => {
    expect(await updatePlannedAccess({ ...input, id: pending.id, expectedUpdatedAt: pending.updatedAt }, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.updatePending).toHaveBeenCalledWith(expect.objectContaining({ companyId: null }));
  });

  it("asocia una empresa existente y audita el nombre original mal escrito", async () => {
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "existing", companyId: company.id, expectedUpdatedAt: pending.updatedAt }, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.validateCompany).toHaveBeenCalledWith(expect.objectContaining({ companyId: company.id, newCompany: undefined }));
    expect(AuditLogEntity.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ originalCompanyName: pending.companySnapshot, companyId: company.id }) }));
  });

  it("registra los datos revisados de una empresa nueva junto con su asociación", async () => {
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "new", expectedUpdatedAt: pending.updatedAt,
      name: "Empresa Nueva", slug: "NUEVA", cif: "B87654321", address: "Calle Industria 1" }, options)).toMatchObject({ success: true });
    expect(PlannedAccessEntity.validateCompany).toHaveBeenCalledWith(expect.objectContaining({ newCompany: expect.objectContaining({ name: "Empresa Nueva", cif: "B87654321" }) }));
  });

  it("exige asociar una empresa ya registrada al intentar crear un nombre equivalente", async () => {
    vi.mocked(CompanyEntity.findNameMatches).mockResolvedValue([company] as never);
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "new", expectedUpdatedAt: pending.updatedAt, name: company.name, slug: "OTRO" }, options)).toMatchObject({ success: false });
    expect(PlannedAccessEntity.validateCompany).not.toHaveBeenCalled();
  });

  it.each(["ACCESS_REQUESTER", "ACCESS_OPERATOR", "ACCESS_MONITOR"])("impide validar empresas al rol %s", async (role) => {
    vi.mocked(UserEntity.getByUsername).mockResolvedValue({ id: "user-1", role } as never);
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "existing", companyId: company.id, expectedUpdatedAt: pending.updatedAt }, options)).toMatchObject({ success: false });
    expect(PlannedAccessEntity.validateCompany).not.toHaveBeenCalled();
  });

  it("respeta el centro del validador", async () => {
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "existing", companyId: company.id, expectedUpdatedAt: pending.updatedAt }, { ...options, lockedSiteId: "other-site" })).toMatchObject({ success: false });
    expect(PlannedAccessEntity.validateCompany).not.toHaveBeenCalled();
  });

  it("detecta una edición concurrente sin informar de una validación exitosa", async () => {
    vi.mocked(PlannedAccessEntity.validateCompany).mockResolvedValue(null);
    expect(await validatePlannedAccessCompany({ id: pending.id, mode: "existing", companyId: company.id, expectedUpdatedAt: pending.updatedAt }, options)).toMatchObject({ success: false });
    expect(AuditLogEntity.create).not.toHaveBeenCalled();
  });

  it("bloquea la aprobación mientras la empresa está pendiente", async () => {
    expect(await updatePlannedAccessStatus({ id: pending.id, status: "APPROVED" }, options)).toMatchObject({ success: false, errors: expect.stringContaining("empresa") });
    expect(PlannedAccessEntity.approve).not.toHaveBeenCalled();
    expect(CompanyEntity.findOrCreateByName).not.toHaveBeenCalled();
  });

  it("usa la empresa asociada para visitantes nuevos al aprobar", async () => {
    vi.mocked(PlannedAccessEntity.findById).mockResolvedValue({ ...pending, companyId: company.id } as never);
    vi.spyOn(ExternalWorkerEntity, "findByLegalId").mockResolvedValue(null);
    vi.spyOn(ExternalWorkerEntity, "create").mockResolvedValue({ id: "worker-1", workCategoryId: "category-1" } as never);
    vi.spyOn(WorkCategoryEntity, "resolveDefault").mockResolvedValue("category-1");
    vi.spyOn(WorkCategoryEntity, "findById").mockResolvedValue({ id: "category-1" } as never);
    expect(await updatePlannedAccessStatus({ id: pending.id, status: "APPROVED" }, options)).toMatchObject({ success: true });
    expect(ExternalWorkerEntity.create).toHaveBeenCalledWith(expect.objectContaining({ companyId: company.id }));
    expect(CompanyEntity.findOrCreateByName).not.toHaveBeenCalled();
  });

  it("bloquea también la aprobación con permisos de trabajo", async () => {
    vi.stubEnv("WORK_PERMITS_ENABLED", "true");
    try {
      expect(await createAndApproveWorkPermitActivity({ plannedAccessId: pending.id }, [], options)).toMatchObject({ success: false, errors: expect.stringContaining("empresa") });
      expect(PlannedAccessEntity.approve).not.toHaveBeenCalled();
    } finally { vi.unstubAllEnvs(); }
  });
});
