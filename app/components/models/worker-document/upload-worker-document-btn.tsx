import { LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { DatePicker } from "~/components/ui/date-picker";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  DOCUMENT_EXPIRY_BASIS_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
  DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE,
  DOCUMENT_TYPE_LABELS,
  hasDocumentField,
  defaultRecordTypeForDocumentType,
} from "~/lib/models/worker-document";
import type { DocumentField } from "~/lib/models/worker-document";
import type { DocumentRecordType, DocumentType } from "../../../../db/enums";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type UploadWorkerDocumentBtnProps = {
  workerId?: string;
  actionPath?: string;
  personId?: string;
  workCategoryId?: string;
  initialDocumentType?: DocumentType;
};

const dateLabels = {
  completedAt: "Realizado el",
  issuedAt: "Emitido el",
  validFrom: "Vigente desde",
  refresherDueAt: "Reciclaje previsto",
  reviewDueAt: "Revisión prevista",
  lastPerformedAt: "Última práctica",
} as const;

export default function UploadWorkerDocumentBtn({
  workerId,
  actionPath,
  personId,
  workCategoryId,
  initialDocumentType = "TRAINING",
}: UploadWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] =
    useState<DocumentType>(initialDocumentType);
  const [recordType, setRecordType] = useState<DocumentRecordType>(
    defaultRecordTypeForDocumentType(initialDocumentType),
  );
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const fetcher = useFetcher<{ errors?: string | string[] }>();
  const isPending = fetcher.state !== "idle";
  const formKey = workerId ?? personId ?? "worker";
  const formId = `upload-document-${formKey}-${documentType}`;
  const formAction =
    actionPath ?? `/api/external-workers/${workerId}/documents`;
  const recordTypeOptions =
    DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE[documentType];
  const supportsExpiry = hasDocumentField(recordType, "validUntil");
  const show = (field: DocumentField) => hasDocumentField(recordType, field);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }
    toast.success("Documento subido y pendiente de revisión");
    setOpen(false);
  }, [fetcher.data, fetcher.state]);

  const changeDocumentType = (value: string) => {
    const nextType = value as DocumentType;
    const nextRecordType = defaultRecordTypeForDocumentType(nextType);
    setDocumentType(nextType);
    setRecordType(nextRecordType);
    setValidUntil(undefined);
  };

  const changeRecordType = (value: string) => {
    const nextRecordType = value as DocumentRecordType;
    setRecordType(nextRecordType);
    if (!hasDocumentField(nextRecordType, "validUntil"))
      setValidUntil(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" className="w-fit">
          <UploadIcon data-icon="inline-start" />
          Subir documento
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="min-w-2xl sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg">Subir documento</SheetTitle>
          <SheetDescription>
            Registra el documento, su alcance y sólo las fechas aplicables a su
            naturaleza.
          </SheetDescription>
        </SheetHeader>

        <fetcher.Form
          id={formId}
          method="post"
          action={formAction}
          encType="multipart/form-data"
          className="min-h-0 flex-1 overflow-y-auto px-4"
        >
          {personId ? (
            <Input type="hidden" name="intent" value="upload-document" />
          ) : null}
          {personId ? (
            <Input type="hidden" name="personId" value={personId} />
          ) : null}
          {workCategoryId ? (
            <Input type="hidden" name="workCategoryId" value={workCategoryId} />
          ) : null}

          <FieldGroup>
            <FieldSet>
              <FieldLegend>Clasificación</FieldLegend>
              <FieldDescription>
                Indica qué tipo de documento estás registrando y qué naturaleza
                tiene.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`documentType-${formKey}`}>
                    Tipo de documento *
                  </FieldLabel>
                  <Select
                    name="documentType"
                    value={documentType}
                    onValueChange={changeDocumentType}
                    required
                  >
                    <SelectTrigger
                      id={`documentType-${formKey}`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`recordType-${formKey}`}>
                    Naturaleza del documento *
                  </FieldLabel>
                  {recordTypeOptions.length === 1 ? (
                    <>
                      <Input
                        readOnly
                        value={DOCUMENT_RECORD_TYPE_LABELS[recordType]}
                      />
                      <Input
                        type="hidden"
                        name="recordType"
                        value={recordType}
                      />
                    </>
                  ) : (
                    <Select
                      name="recordType"
                      value={recordType}
                      onValueChange={changeRecordType}
                      required
                    >
                      <SelectTrigger
                        id={`recordType-${formKey}`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {recordTypeOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {DOCUMENT_RECORD_TYPE_LABELS[value]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Fechas y vigencia</FieldLegend>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    "completedAt",
                    "issuedAt",
                    "validFrom",
                    "refresherDueAt",
                    "reviewDueAt",
                    "lastPerformedAt",
                  ] as const
                )
                  .filter(show)
                  .map((field) => (
                    <Field key={field}>
                      <FieldLabel htmlFor={`${field}-${formKey}`}>
                        {dateLabels[field]}
                      </FieldLabel>
                      <DatePicker id={`${field}-${formKey}`} name={field} />
                    </Field>
                  ))}
                {supportsExpiry ? (
                  <Field>
                    <FieldLabel htmlFor={`validUntil-${formKey}`}>
                      Vigente hasta
                    </FieldLabel>
                    <DatePicker
                      id={`validUntil-${formKey}`}
                      name="validUntil"
                      value={validUntil}
                      onChange={setValidUntil}
                    />
                  </Field>
                ) : null}
                {supportsExpiry && validUntil ? (
                  <Field>
                    <FieldLabel htmlFor={`expiryBasis-${formKey}`}>
                      Origen de la vigencia
                    </FieldLabel>
                    <Select name="expiryBasis" defaultValue="NOT_APPLICABLE">
                      <SelectTrigger
                        id={`expiryBasis-${formKey}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Seleccionar origen" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {Object.entries(DOCUMENT_EXPIRY_BASIS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Alcance y responsables</FieldLegend>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                {show("issuer") ? (
                  <Field>
                    <FieldLabel htmlFor={`issuer-${formKey}`}>
                      Emisor
                    </FieldLabel>
                    <Input id={`issuer-${formKey}`} name="issuer" />
                  </Field>
                ) : null}
                {show("employerAuthorizer") ? (
                  <Field>
                    <FieldLabel htmlFor={`employerAuthorizer-${formKey}`}>
                      Autorizador empresarial
                    </FieldLabel>
                    <Input
                      id={`employerAuthorizer-${formKey}`}
                      name="employerAuthorizer"
                    />
                  </Field>
                ) : null}
                {show("legalSource") ? (
                  <Field>
                    <FieldLabel htmlFor={`legalSource-${formKey}`}>
                      Fuente normativa o procedencia
                    </FieldLabel>
                    <Input id={`legalSource-${formKey}`} name="legalSource" />
                  </Field>
                ) : null}
                {show("jurisdiction") ? (
                  <Field>
                    <FieldLabel htmlFor={`jurisdiction-${formKey}`}>
                      Jurisdicción
                    </FieldLabel>
                    <Input
                      id={`jurisdiction-${formKey}`}
                      name="jurisdiction"
                      placeholder="Ej. ES-Murcia"
                    />
                  </Field>
                ) : null}
                {show("sector") ? (
                  <Field>
                    <FieldLabel htmlFor={`sector-${formKey}`}>
                      Sector
                    </FieldLabel>
                    <Input id={`sector-${formKey}`} name="sector" />
                  </Field>
                ) : null}
                {show("taskScope") ? (
                  <Field>
                    <FieldLabel htmlFor={`taskScope-${formKey}`}>
                      Tarea, oficio o zona
                    </FieldLabel>
                    <Input id={`taskScope-${formKey}`} name="taskScope" />
                  </Field>
                ) : null}
                {show("procedureVersion") ? (
                  <Field>
                    <FieldLabel htmlFor={`procedureVersion-${formKey}`}>
                      Versión del procedimiento
                    </FieldLabel>
                    <Input
                      id={`procedureVersion-${formKey}`}
                      name="procedureVersion"
                    />
                  </Field>
                ) : null}
                {show("riskScopes") ? (
                  <Field>
                    <FieldLabel htmlFor={`riskScopes-${formKey}`}>
                      Riesgos cubiertos
                    </FieldLabel>
                    <Input
                      id={`riskScopes-${formKey}`}
                      name="riskScopes"
                      placeholder="Separados por comas"
                    />
                  </Field>
                ) : null}
                {show("equipmentTypes") ? (
                  <Field>
                    <FieldLabel htmlFor={`equipmentTypes-${formKey}`}>
                      Equipos cubiertos
                    </FieldLabel>
                    <Input
                      id={`equipmentTypes-${formKey}`}
                      name="equipmentTypes"
                      placeholder="Separados por comas"
                    />
                  </Field>
                ) : null}
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Archivo y notas</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`file-${formKey}`}>Archivo *</FieldLabel>
                  <Input
                    id={`file-${formKey}`}
                    name="file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                  />
                  <FieldDescription>
                    Sólo PDF, JPEG o PNG. Máximo 5 Mb
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`notes-${formKey}`}>Notas</FieldLabel>
                  <Textarea
                    id={`notes-${formKey}`}
                    name="notes"
                    placeholder="Información adicional del documento"
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            {fetcher.data?.errors ? (
              <p
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {getActionErrorMessage(fetcher.data.errors)}
              </p>
            ) : null}
          </FieldGroup>
        </fetcher.Form>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </SheetClose>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isPending ? "Subiendo…" : "Subir documento"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
