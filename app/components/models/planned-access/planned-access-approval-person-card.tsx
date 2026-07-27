import { useState } from "react";
import { Link } from "react-router";
import type { WorkCategory } from "../../../../db/schema";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import type { ExternalWorkerDetail } from "~/lib/database/external-worker.server";
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import { isDateValidThrough } from "~/lib/document-expiry";
import type { DocumentType } from "../../../../db/enums";
import { Badge } from "~/components/ui/badge";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import UploadWorkerDocumentBtn from "~/components/models/worker-document/upload-worker-document-btn";
import ReviewPlannedAccessDocumentBtn from "./review-planned-access-document-btn";
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

type Person = PlannedAccessListItem["plannedAccessPersons"][number];
export default function PlannedAccessApprovalPersonCard({
  person,
  worker,
  workCategories,
  validThrough,
  actionPath,
  workerPath,
  formId,
}: {
  person: Person;
  worker: ExternalWorkerDetail | null;
  workCategories: WorkCategory[];
  validThrough: Date;
  actionPath: string;
  workerPath: string;
  formId: string;
}) {
  const [categoryId, setCategoryId] = useState(
    person.workCategoryId ?? worker?.workCategoryId ?? "",
  );
  const category = workCategories.find((item) => item.id === categoryId);
  const requiresTraining = Boolean(category?.requiresTraining);
  const requiresSpecialPermission = Boolean(category?.requiresSpecialPermission);

  return (
    <Item variant="outline" className="items-start">
        <ItemContent className="min-w-0">
          <ItemTitle>{`${person.firstNameSnapshot} ${person.lastNameSnapshot}`}</ItemTitle>
          <ItemDescription className="break-words">Identificación: {person.legalIdSnapshot}</ItemDescription>
        <FieldWrapper
          label="Categoría laboral *"
          htmlFor={`category-${person.id}`}
        >
          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            required
          >
            <SelectTrigger id={`category-${person.id}`} className="w-full">
              <SelectValue placeholder="Sin categoría adicional" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {workCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {category.requiresTraining ? " (requiere formación)" : ""}
                    {category.requiresSpecialPermission
                      ? " (requiere permiso especial)"
                      : ""}
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
        </ItemContent>
        <ItemActions className="self-start">
          {worker ? (
            <Link className="text-sm text-primary hover:underline" to={`${workerPath}/${worker.id}`}>
              Ver expediente
            </Link>
          ) : null}
        </ItemActions>
        <ItemFooter className="flex-col items-stretch gap-3">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Documentación requerida</h4>
          {(
            [
              "IDENTIFICATION",
              ...(requiresTraining ? ["TRAINING"] : []),
              ...(requiresSpecialPermission ? ["SPECIAL_PERMISSION"] : []),
            ] as DocumentType[]
          ).map((documentType) => (
            <DocumentRequirement
              key={documentType}
              worker={worker}
              documentType={documentType}
              validThrough={validThrough}
              personId={person.id}
              workCategoryId={categoryId}
              actionPath={actionPath}
            />
          ))}
          </div>
        </ItemFooter>
    </Item>
  );
}

function DocumentRequirement({
  worker,
  documentType,
  validThrough,
  personId,
  workCategoryId,
  actionPath,
}: {
  worker: ExternalWorkerDetail | null;
  documentType: DocumentType;
  validThrough: Date;
  personId: string;
  workCategoryId: string;
  actionPath: string;
}) {
  const documents =
    worker?.documents?.filter(
      (document) => document.documentType === documentType,
    ) ?? [];
  const valid = documents.some(
    (document) =>
      document.status === "VALIDATED" &&
      isDateValidThrough(document.validUntil, validThrough),
  );
  const pendingDocuments = documents.filter((document) => document.status === "PENDING_REVIEW");

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {DOCUMENT_TYPE_LABELS[documentType]}
        </span>
        <Badge variant={valid ? "secondary" : pendingDocuments.length ? "outline" : "destructive"}>
          {valid
            ? "Vigente"
            : pendingDocuments.length
              ? "Pendiente de revisión"
              : documents.some((document) => document.status === "REJECTED")
                ? "Rechazado"
                : documents.some((document) => document.status === "EXPIRED")
                  ? "Expirado"
                  : "Faltante"}
        </Badge>
      </div>
      {documents.length ? (
        <p className="text-xs text-muted-foreground">
          {documents
            .map(
              (document) =>
                `${document.fileName} (${document.validUntil?.toLocaleDateString("es-ES") ?? "Sin vencimiento"})`,
            )
            .join(", ")}
        </p>
      ) : null}
      {documents.map((document) => (
        <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            className="max-w-full truncate text-primary hover:underline"
            to={`/api/external-workers/${worker?.id}/documents/${document.id}/file`}
            target="_blank"
            rel="noreferrer"
          >
            {document.fileName}
          </Link>
          {document.status === "PENDING_REVIEW" && worker ? (
            <ReviewPlannedAccessDocumentBtn
              actionPath={actionPath}
              documentId={document.id}
              documentType={documentType}
              fileName={document.fileName}
              personId={personId}
            />
          ) : null}
        </div>
      ))}
      {!valid && !pendingDocuments.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
             Carga el documento aquí. Quedará pendiente de revisión y no habilitará la aprobación hasta ser validado.
          </p>
          <UploadWorkerDocumentBtn
            workerId={worker?.id}
            personId={personId}
            workCategoryId={workCategoryId}
            actionPath={actionPath}
            initialDocumentType={documentType}
          />
        </div>
      ) : null}
    </div>
  );
}
