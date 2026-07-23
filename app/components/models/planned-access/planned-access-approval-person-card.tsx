import { useState } from "react";
import type { WorkCategory } from "../../../../db/schema";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import type { ExternalWorkerDetail } from "~/lib/database/external-worker.server";
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import { isDateValidThrough } from "~/lib/document-expiry";
import type { DocumentType } from "../../../../db/enums";
import { Badge } from "~/components/ui/badge";
import CardContainer from "~/components/containers/card-container";
import { DatePicker } from "~/components/ui/date-picker";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
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
}: {
  person: Person;
  worker: ExternalWorkerDetail | null;
  workCategories: WorkCategory[];
  validThrough: Date;
}) {
  const [categoryId, setCategoryId] = useState(
    person.workCategoryId ?? worker?.workCategoryId ?? "",
  );
  const category = workCategories.find((item) => item.id === categoryId);
  const requiresTraining = Boolean(category?.requiresTraining);
  const requiresSpecialPermission = Boolean(category?.requiresSpecialPermission);

  return (
    <CardContainer
      className="max-w-1/3"
      title={`${person.firstNameSnapshot} ${person.lastNameSnapshot}`}
      description={<span>Identificación: {person.legalIdSnapshot}</span>}
    >
      <div className="flex flex-col gap-5">
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
          />
        </FieldWrapper>
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">Documentación</h4>
          {(
            [
              "IDENTIFICATION",
              ...(requiresTraining ? ["TRAINING"] : []),
              ...(requiresSpecialPermission ? ["SPECIAL_PERMISSION"] : []),
            ] as DocumentType[]
          ).map((documentType) => (
            <DocumentRequirement
              key={documentType}
              personId={person.id}
              worker={worker}
              documentType={documentType}
              required
              validThrough={validThrough}
            />
          ))}
        </div>
      </div>
    </CardContainer>
  );
}

function DocumentRequirement({
  personId,
  worker,
  documentType,
  required,
  validThrough,
}: {
  personId: string;
  worker: ExternalWorkerDetail | null;
  documentType: DocumentType;
  required: boolean;
  validThrough: Date;
}) {
  const documents =
    worker?.documents?.filter(
      (document) => document.documentType === documentType,
    ) ?? [];
  const valid = documents.some(
    (document) =>
      document.status === "VALIDATED" &&
      isDateValidThrough(document.expiryDate, validThrough),
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {DOCUMENT_TYPE_LABELS[documentType]}
        </span>
        <Badge variant={valid ? "secondary" : "destructive"}>
          {valid ? "Vigente" : documents.length ? "Actualizar" : "Faltante"}
        </Badge>
      </div>
      {documents.length ? (
        <p className="text-xs text-muted-foreground">
          {documents
            .map(
              (document) =>
                `${document.fileName} (${document.expiryDate.toLocaleDateString("es-ES")})`,
            )
            .join(", ")}
        </p>
      ) : null}
      {!valid ? (
        <div className="grid gap-3 md:grid-cols-2">
          <FieldWrapper
            label={`Archivo${required ? " *" : ""}`}
            htmlFor={`file-${personId}-${documentType}`}
          >
            <Input
              id={`file-${personId}-${documentType}`}
              type="file"
              name={`documentFiles[${personId}][${documentType}]`}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              required={required}
            />
          </FieldWrapper>
          <FieldWrapper
            label={`Vencimiento${required ? " *" : ""}`}
            htmlFor={`expiry-${personId}-${documentType}`}
          >
            <DatePicker
              id={`expiry-${personId}-${documentType}`}
              name={`documentExpiry[${personId}][${documentType}]`}
              required={required}
              placeholder="DD/MM/AAAA"
            />
          </FieldWrapper>
        </div>
      ) : null}
    </div>
  );
}
