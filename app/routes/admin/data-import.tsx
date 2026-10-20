import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import type { Route } from "./+types/data-import";
import { validateUserRole } from "~/lib/auth.server";
import { getDataImportSites, importData, previewDataImport } from "~/lib/services/data-import.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { DatePicker } from "~/components/ui/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";

type PreviewData = {
  totalRows: number;
  importable: number;
  issues: Array<{ rowNumber: number; label: string; reason: string }>;
  records: Array<{ rowNumber: number; company: string; worker: string; legalId: string; area: string; task: string }>;
  truncated: boolean;
  date: string;
};

function inferDateFromFileName(fileName: string) {
  const match = fileName.match(/(?:^|\D)(\d{1,2})[-_.](\d{1,2})[-_.](\d{2}|\d{4})(?:\D|$)/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day
    ? candidate
    : "";
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER"]);
  const sites = await getDataImportSites();
  return {
    sites,
    initialSiteId: sites.find((site) => site.name.toLocaleLowerCase("es").includes("el raal"))?.id ?? sites[0]?.id ?? "",
    plannedAccessPath: user.role === "ADMIN" ? "/admin/planned-access" : "/security/planned-access",
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER"]);
  const formData = await request.formData();
  const file = formData.get("file");
  const siteId = String(formData.get("siteId") ?? "");
  const date = String(formData.get("date") ?? "");
  const intent = formData.get("intent");
  if (!(file instanceof File) || !siteId || !date) {
    return { success: false as const, error: "Selecciona el archivo, el centro y la fecha del acceso." };
  }
  try {
    if (intent === "preview") {
      return { success: true as const, intent, fileName: file.name, siteId, preview: await previewDataImport({ file, siteId, date }) };
    }
    if (intent === "import") {
      return { success: true as const, intent, fileName: file.name, result: await importData({
        file, siteId, date, changedBy: user.id, departmentId: user.department.id,
      }) };
    }
    return { success: false as const, error: "La acción de importación no es válida." };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "No se pudo procesar el archivo." };
  }
}

export default function DataImportPage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();
  const [siteId, setSiteId] = useState(loaderData.initialSiteId);
  const [date, setDate] = useState<Date | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = feedbackDismissed ? undefined : fetcher.data;
  const isBusy = fetcher.state !== "idle";
  const dateValue = date ? format(date, "yyyy-MM-dd") : "";
  const preview = data?.success && data.intent === "preview" && data.fileName === file?.name && data.preview?.date === dateValue && data.siteId === siteId
    ? data.preview as PreviewData
    : null;
  const result = data?.success && data.intent === "import" ? data.result : null;

  useEffect(() => {
    if (result) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [result]);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setFeedbackDismissed(true);
    const inferredDate = nextFile ? inferDateFromFileName(nextFile.name) : "";
    setDate(inferredDate ? parseISO(inferredDate) : undefined);
  }

  function submit(intent: "preview" | "import") {
    if (!file || !siteId || !dateValue) return;
    setFeedbackDismissed(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("siteId", siteId);
    formData.append("date", dateValue);
    formData.append("intent", intent);
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <header className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={loaderData.plannedAccessPath}><ArrowLeft data-icon="inline-start" /> Volver a accesos planificados</Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Importar accesos planificados</h1>
          <p className="max-w-3xl text-muted-foreground">Carga un Excel de accesos diarios. Revisa las filas detectadas y crea un acceso planificado por empresa.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Archivo y datos del acceso</CardTitle>
          <CardDescription>
            El sistema reconoce Empresa, Trabajador, DNI, Lugar de trabajo autorizado y Tareas a realizar. Asocia o crea los registros de catálogo que falten y omite las filas incompletas o conflictivas para evitar duplicados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="import-site">Centro de trabajo</FieldLabel>
              <Select value={siteId} onValueChange={(value) => { setSiteId(value ?? ""); setFeedbackDismissed(true); }}>
                <SelectTrigger id="import-site" className="w-full"><SelectValue placeholder="Seleccionar centro" /></SelectTrigger>
                <SelectContent>
                  {loaderData.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="planned-date">Fecha de los accesos</FieldLabel>
              <DatePicker
                id="planned-date"
                value={date ?? null}
                onChange={(value) => { setDate(value); setFeedbackDismissed(true); }}
                required
                className="w-full"
                placeholder="DD/MM/AAAA"
              />
              <FieldDescription>Si el nombre del archivo incluye una fecha, se completa automáticamente. Revísala antes de continuar.</FieldDescription>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="import-file">Archivo Excel o CSV</FieldLabel>
              <Input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
              />
              <FieldDescription>Formato esperado: una fila por trabajador con su empresa, DNI, área y tarea.</FieldDescription>
            </Field>
          </FieldGroup>

          {file ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <FileSpreadsheet aria-hidden="true" className="text-muted-foreground" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          ) : null}

          {data && !data.success ? (
            <Alert variant="destructive"><AlertTitle>No se pudo procesar</AlertTitle><AlertDescription>{data.error}</AlertDescription></Alert>
          ) : null}
          {result ? (
            <Alert>
              <AlertTitle>Importación completada</AlertTitle>
              <AlertDescription>
                Se crearon {result.plannedAccessesCreated} accesos planificados para {result.peopleImported} personas. Catálogos nuevos: {result.companiesCreated} empresas, {result.workersCreated} personas trabajadoras, {result.categoriesCreated} categorías y {result.areasCreated} áreas. Se omitieron {result.skipped} filas conflictivas o incompletas.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end border-t pt-4">
            <Button type="button" variant="outline" disabled={!file || !siteId || !dateValue || isBusy} onClick={() => submit("preview")}>
              <FileSpreadsheet data-icon="inline-start" /> {isBusy && fetcher.formData?.get("intent") === "preview" ? "Leyendo archivo…" : "Mostrar vista previa"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Revisar importación</CardTitle>
            <CardDescription>
              Fecha del acceso: {format(parseISO(preview.date), "dd/MM/yyyy")}. Los registros válidos se agruparán por empresa. {preview.issues.length} filas se omitirán por estar incompletas o en conflicto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted/40 px-4 py-3 text-sm">
              <p><span className="font-semibold">{preview.importable}</span> filas listas para importar</p>
              <p><span className="font-semibold">{preview.totalRows}</span> filas leídas</p>
              <p><span className="font-semibold">{preview.issues.length}</span> filas que se omitirán</p>
            </div>
            {preview.records.length ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Fila</TableHead><TableHead>Empresa</TableHead><TableHead>Trabajador</TableHead><TableHead>DNI/NIE</TableHead><TableHead>Área autorizada</TableHead><TableHead>Tarea</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {preview.records.map((row) => <TableRow key={`${row.rowNumber}-${row.legalId}`}>
                      <TableCell>{row.rowNumber}</TableCell><TableCell>{row.company}</TableCell><TableCell>{row.worker}</TableCell><TableCell>{row.legalId}</TableCell><TableCell>{row.area}</TableCell><TableCell>{row.task}</TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            ) : <p className="text-sm text-muted-foreground">No hay filas válidas para importar.</p>}
            {preview.truncated ? <p className="text-sm text-muted-foreground">Se muestran las primeras 100 filas válidas.</p> : null}
            {preview.issues.length ? (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Filas que se omitirán</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Fila</TableHead><TableHead>Registro</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
                    <TableBody>{preview.issues.map((item, index) => <TableRow key={`${item.rowNumber}-${index}`}>
                      <TableCell>{item.rowNumber}</TableCell><TableCell>{item.label}</TableCell><TableCell>{item.reason}</TableCell>
                    </TableRow>)}</TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
            <div className="flex justify-end border-t pt-4">
              <Button type="button" disabled={!preview.importable || isBusy} onClick={() => submit("import")}>
                <Upload data-icon="inline-start" /> {isBusy && fetcher.formData?.get("intent") === "import" ? "Importando…" : "Crear accesos planificados"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
