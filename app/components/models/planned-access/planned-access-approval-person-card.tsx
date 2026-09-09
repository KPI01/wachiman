import { useState } from "react";
import { Link } from "react-router";
import type { AllowedArea, WorkCategory } from "../../../../db/schema";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import type { ExternalWorkerDetail } from "~/lib/database/external-worker.server";
// Comentado: la documentación ya no se muestra en el flujo de aprobación.
// import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
// import { isDateValidThrough } from "~/lib/document-expiry";
// import type { DocumentType } from "../../../../db/enums";
// import { Badge } from "~/components/ui/badge";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import AllowedAreaCombobox from "~/components/models/access-logs/allowed-area-combobox";
// import UploadWorkerDocumentBtn from "~/components/models/worker-document/upload-worker-document-btn";
// import ReviewPlannedAccessDocumentBtn from "./review-planned-access-document-btn";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "~/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

type Person = PlannedAccessListItem["plannedAccessPersons"][number];
export default function PlannedAccessApprovalPersonCard({
  person,
  worker,
  workCategories,
  allowedAreas,
  validThrough,
  actionPath,
  workerPath,
  formId,
  requiresWorkPermit,
  workPermitsEnabled,
}: {
  person: Person;
  worker: ExternalWorkerDetail | null;
  workCategories: WorkCategory[];
  allowedAreas: AllowedArea[];
  validThrough: Date;
  actionPath: string;
  workerPath: string;
  formId: string;
  requiresWorkPermit: boolean;
  workPermitsEnabled: boolean;
}) {
  const [categoryId, setCategoryId] = useState(
    person.workCategoryId ?? worker?.workCategoryId ?? "",
  );
  const [allowedAreaId, setAllowedAreaId] = useState(person.allowedAreaId ?? "");
  const [accessDecision, setAccessDecision] = useState("PENDING");
  const [workDecision, setWorkDecision] = useState(
    requiresWorkPermit ? "PENDING" : "NOT_REQUIRED",
  );
  const [decisionReason, setDecisionReason] = useState("");
  const [restrictions, setRestrictions] = useState("");
  // Comentado: solo se usaba para el bloque de documentación.
  // const category = workCategories.find((item) => item.id === categoryId);
  // Comentado: la documentación ya no se muestra en el flujo de aprobación.
  // const requiresTraining = Boolean(category?.requiresTraining);
  // const requiresSpecialPermission = Boolean(
  //   category?.requiresSpecialPermission,
  // );

  return (
    <Item variant="outline" className="items-start">
      <ItemContent className="min-w-0">
        <ItemTitle>{`${person.firstNameSnapshot} ${person.lastNameSnapshot}`}</ItemTitle>
        <ItemDescription className="wrap-break-word">
          Identificación: {person.legalIdSnapshot}
        </ItemDescription>
        <FieldWrapper
          label="Tipo de trabajo *"
          htmlFor={`category-${person.id}`}
        >
          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            disabled={!workCategories.length}
            required
          >
            <SelectTrigger id={`category-${person.id}`} className="w-full">
              <SelectValue placeholder="Sin tipo de trabajo adicional" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {workCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {/* Comentado: los requisitos documentales ya no se muestran. */}
                    {/* {category.requiresTraining ? " (requiere formación)" : ""}
                    {category.requiresSpecialPermission
                      ? " (requiere permiso especial)"
                      : ""} */}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <input
            type="hidden"
            name={`personWorkCategories[${person.id}]`}
            value={categoryId}
            form={formId}
          />
        </FieldWrapper>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldWrapper label="Acceso al centro *" htmlFor={`access-decision-${person.id}`}>
            <Select value={accessDecision} onValueChange={setAccessDecision}>
              <SelectTrigger id={`access-decision-${person.id}`} className="w-full">
                <SelectValue placeholder="Decidir acceso..." />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  <SelectItem value="APPROVED">Permitir acceso</SelectItem>
                  <SelectItem value="DENIED">Denegar acceso</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name={`personDecisions[${person.id}].accessDecision`}
              value={accessDecision}
              form={formId}
            />
          </FieldWrapper>
          {workPermitsEnabled ? (
            <FieldWrapper
              label={requiresWorkPermit ? "Trabajo autorizado *" : "Trabajo autorizado"}
              htmlFor={`work-decision-${person.id}`}
            >
              <Select value={workDecision} onValueChange={setWorkDecision}>
                <SelectTrigger id={`work-decision-${person.id}`} className="w-full">
                  <SelectValue placeholder="Decidir trabajo..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {!requiresWorkPermit ? <SelectItem value="NOT_REQUIRED">No requiere permiso</SelectItem> : null}
                    <SelectItem value="APPROVED">Autorizar trabajo</SelectItem>
                    <SelectItem value="DENIED">No autorizar trabajo</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name={`personDecisions[${person.id}].workDecision`}
                value={workDecision}
                form={formId}
              />
            </FieldWrapper>
          ) : null}
        </div>
        <FieldWrapper label="Motivo de la decisión" htmlFor={`decision-reason-${person.id}`}>
          <Textarea
            id={`decision-reason-${person.id}`}
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.currentTarget.value)}
            placeholder="Obligatorio si se deniega el acceso o el trabajo"
          />
          <input
            type="hidden"
            name={`personDecisions[${person.id}].decisionReason`}
            value={decisionReason}
            form={formId}
          />
        </FieldWrapper>
        {requiresWorkPermit ? (
          <FieldWrapper label="Restricciones individuales" htmlFor={`restrictions-${person.id}`}>
            <Textarea
              id={`restrictions-${person.id}`}
              value={restrictions}
              onChange={(event) => setRestrictions(event.currentTarget.value)}
              placeholder="Ejemplo: No puede realizar trabajos en altura"
            />
            <input
              type="hidden"
              name={`personDecisions[${person.id}].restrictions`}
              value={restrictions}
              form={formId}
            />
          </FieldWrapper>
        ) : null}
        <FieldWrapper
          label="Área autorizada *"
          htmlFor={`allowed-area-${person.id}-search`}
        >
          <AllowedAreaCombobox
            id={`allowed-area-${person.id}`}
            name={`personAllowedAreas[${person.id}]`}
            value={allowedAreaId}
            selectedName={
              allowedAreas.find((area) => area.id === allowedAreaId)?.name ??
              person.allowedAreaSnapshot
            }
            onValueChange={setAllowedAreaId}
            form={formId}
            required
            placeholder="Selecciona un área..."
          />
        </FieldWrapper>
      </ItemContent>
      <ItemActions className="self-start">
        {worker ? (
          <Link
            className="text-sm text-primary hover:underline"
            to={`${workerPath}/${worker.id}`}
          >
            Ver expediente
          </Link>
        ) : null}
      </ItemActions>
      <ItemFooter className="flex-col items-stretch gap-3">
        {/* Comentado: la documentación ya no se muestra en el flujo de aprobación. */}
        {/* <div className="flex flex-col gap-3"> */}
        {/*   <h4 className="text-sm font-semibold">Documentación requerida</h4> */}
        {/*   {( */}
        {/*     [ */}
        {/*       "IDENTIFICATION", */}
        {/*       ...(requiresTraining ? ["TRAINING"] : []), */}
        {/*       ...(requiresSpecialPermission ? ["SPECIAL_PERMISSION"] : []), */}
        {/*     ] as DocumentType[] */}
        {/*   ).map((documentType) => ( */}
        {/*     <DocumentRequirement */}
        {/*       key={documentType} */}
        {/*       worker={worker} */}
        {/*       documentType={documentType} */}
        {/*       validThrough={validThrough} */}
        {/*       personId={person.id} */}
        {/*       workCategoryId={categoryId} */}
        {/*       actionPath={actionPath} */}
        {/*     /> */}
        {/*   ))} */}
        {/* </div> */}
      </ItemFooter>
    </Item>
  );
}

// Comentado: la documentación ya no se muestra en el flujo de aprobación.
// function DocumentRequirement({
//   worker,
//   documentType,
//   validThrough,
//   personId,
//   workCategoryId,
//   actionPath,
// }: {
//   worker: ExternalWorkerDetail | null;
//   documentType: DocumentType;
//   validThrough: Date;
//   personId: string;
//   workCategoryId: string;
//   actionPath: string;
// }) {
//   const documents =
//     worker?.documents?.filter(
//       (document) => document.documentType === documentType,
//     ) ?? [];
//   const valid = documents.some(
//     (document) =>
//       document.status === "VALIDATED" &&
//       isDateValidThrough(document.validUntil, validThrough),
//   );
//   const pendingDocuments = documents.filter(
//     (document) => document.status === "PENDING_REVIEW",
//   );

//   return (
//     <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
//       <div className="flex flex-wrap items-center justify-between gap-2">
//         <span className="font-medium">
//           {DOCUMENT_TYPE_LABELS[documentType]}
//         </span>
//         <Badge
//           variant={
//             valid
//               ? "secondary"
//               : pendingDocuments.length
//                 ? "outline"
//                 : "destructive"
//           }
//         >
//           {valid
//             ? "Vigente"
//             : pendingDocuments.length
//               ? "Pendiente de revisión"
//               : documents.some((document) => document.status === "REJECTED")
//                 ? "Rechazado"
//                 : documents.some((document) => document.status === "EXPIRED")
//                   ? "Expirado"
//                   : "Faltante"}
//         </Badge>
//       </div>
//       {documents.length ? (
//         <p className="text-xs text-muted-foreground">
//           {documents
//             .map(
//               (document) =>
//                 `${document.fileName} (${document.validUntil?.toLocaleDateString("es-ES") ?? "Sin vencimiento"})`,
//             )
//             .join(", ")}
//         </p>
//       ) : null}
//       {documents.map((document) => (
//         <div
//           key={document.id}
//           className="flex flex-wrap items-center justify-between gap-2 text-xs"
//         >
//           <Link
//             className="max-w-full truncate text-primary hover:underline"
//             to={`/api/external-workers/${worker?.id}/documents/${document.id}/file`}
//             target="_blank"
//             rel="noreferrer"
//           >
//             {document.fileName}
//           </Link>
//           {document.status === "PENDING_REVIEW" && worker ? (
//             <ReviewPlannedAccessDocumentBtn
//               actionPath={actionPath}
//               documentId={document.id}
//               documentType={documentType}
//               fileName={document.fileName}
//               personId={personId}
//             />
//           ) : null}
//         </div>
//       ))}
//       {!valid && !pendingDocuments.length ? (
//         <div className="flex flex-col gap-2">
//           <p className="text-xs text-muted-foreground">
//             Carga el documento aquí. Quedará pendiente de revisión y no
//             habilitará la aprobación hasta ser validado.
//           </p>
//           <UploadWorkerDocumentBtn
//             workerId={worker?.id}
//             personId={personId}
//             workCategoryId={workCategoryId}
//             actionPath={actionPath}
//             initialDocumentType={documentType}
//           />
//         </div>
//       ) : null}
//     </div>
//   );
// }
