import z from "zod";
import { requiredString, optionalString } from "../schemas/generic";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { UserEntity } from "../database/user.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { WorkCategoryEntity } from "../database/work-category.server";

const reviewSchema = z.object({
  id: requiredString,
  personId: requiredString,
  expectedUpdatedAt: z.coerce.date(),
  decision: z.enum(["APPROVED", "DENIED"]),
  reason: optionalString,
}).superRefine((value, context) => {
  if (value.decision === "DENIED" && !value.reason) {
    context.addIssue({ code: "custom", path: ["reason"], message: "Indica el motivo del rechazo." });
  }
});

export async function reviewPlannedAccessPerson(input: Record<string, unknown>, options: {
  authorUsername: string;
  lockedSiteId?: string;
}) {
  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author || !["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"].includes(author.role ?? "")) {
    return { success: false, errors: "No tienes permisos para revisar solicitudes." };
  }
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: z.treeifyError(parsed.error) };
  const request = await PlannedAccessEntity.findById(parsed.data.id);
  if (!request || (options.lockedSiteId && request.siteId !== options.lockedSiteId)) {
    return { success: false, errors: "No tienes permisos para esta solicitud." };
  }
  if ((request.status ?? "PENDING_APPROVAL") !== "PENDING_APPROVAL") {
    return { success: false, errors: "La revisión de esta solicitud ya ha finalizado." };
  }
  const person = request.plannedAccessPersons.find((item) => item.id === parsed.data.personId);
  if (!person) return { success: false, errors: "La persona no pertenece a esta solicitud." };
  if (person.decision && person.decision.accessDecision !== "PENDING") {
    return { success: false, errors: "Esta persona ya tiene una decisión registrada." };
  }
  let worker: Awaited<ReturnType<typeof ExternalWorkerEntity.findByLegalId>> = null;
  let categoryId: string | undefined;
  if (parsed.data.decision === "APPROVED") {
    if (!request.companyId) return { success: false, errors: "Valida y asocia la empresa antes de aprobar visitantes." };
    worker = await ExternalWorkerEntity.findByLegalId(person.legalIdSnapshot);
    categoryId = person.workCategoryId ?? worker?.workCategoryId ?? await WorkCategoryEntity.resolveDefault();
    if (!await WorkCategoryEntity.findById(categoryId)) {
      return { success: false, errors: "El tipo de trabajo de la persona ya no existe." };
    }
    if (!person.allowedAreaId && !person.allowedAreaSnapshot.trim()) {
      return { success: false, errors: "La persona no tiene un área autorizada indicada." };
    }
  }
  const result = await PlannedAccessEntity.decidePerson({
    ...parsed.data,
    authorId: author.id,
    workerId: worker?.id,
    categoryId,
  });
  if (!result) return { success: false, errors: "La solicitud ha cambiado. Recarga la página antes de continuar." };
  return { success: true, status: result.status };
}
