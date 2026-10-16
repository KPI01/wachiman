import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import type { Route } from "./+types/data-import";
import { validateUserRole } from "~/lib/auth.server";
import { getDataImportSites, importData, previewDataImport } from "~/lib/services/data-import.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

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
  await validateUserRole(request, "ADMIN");
  const sites = await getDataImportSites();
  return { sites, initialSiteId: sites.find((site) => site.name.toLocaleLowerCase("es").includes("el raal"))?.id ?? sites[0]?.id ?? "" };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
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
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = fetcher.data;
  const isBusy = fetcher.state !== "idle";
  const preview = data?.success && data.intent === "preview" && data.fileName === file?.name && data.preview?.date === date && data.siteId === siteId
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
    if (nextFile) setDate(inferDateFromFileName(nextFile.name));
  }

  function submit(intent: "preview" | "import") {
    if (!file || !siteId || !date) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("siteId", siteId);
    formData.append("date", date);
    formData.append("intent", intent);
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/admin/planned-access"><ArrowLeft /> Volver a accesos planificados</Link>
          </Button>
          <h1 className="text-3xl font-bold">Importar accesos planificados</h1>
          <p className="mt-1 text-muted-foreground">Carga un Excel de accesos diarios y prepara una solicitud por empresa.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archivo de accesos diarios</CardTitle>
          <CardDescription>
            Se reconocen las columnas Empresa, Trabajador, DNI, Lugar de trabajo autorizado y Tareas a realizar. Para cada empresa se crea un acceso planificado pendiente de aprobación. Las empresas, personas, categorías de trabajo y áreas se asocian con el catálogo o se crean si faltan. Las filas incompletas o conflictivas se omiten sin duplicar registros.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-site">Centro de trabajo</Label>
              <Select value={siteId} onValueChange={(value) => setSiteId(value ?? "")}>
                <SelectTrigger id="import-site"><SelectValue placeholder="Seleccionar centro" /></SelectTrigger>
                <SelectContent>
                  {loaderData.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="planned-date">Fecha de los accesos</Label>
              <Input id="planned-date" type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} required />
              <p className="text-xs text-muted-foreground">Se detecta si el nombre del archivo incluye una fecha como 17-10-26; revísala antes de continuar.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">Archivo Excel o CSV</Label>
            <Input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
            />
            {file ? <span className="text-sm text-muted-foreground">{file.name} · {(file.size / 1024).toFixed(0)} KB</span> : null}
          </div>

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

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!file || !siteId || !date || isBusy} onClick={() => submit("preview")}>
              <FileSpreadsheet /> {isBusy && fetcher.formData?.get("intent") === "preview" ? "Leyendo archivo…" : "Mostrar vista previa"}
            </Button>
            <Button type="button" disabled={!file || !siteId || !date || !preview?.importable || isBusy} onClick={() => submit("import")}>
              <Upload /> {isBusy && fetcher.formData?.get("intent") === "import" ? "Importando…" : "Crear accesos planificados"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa · {preview.date}</CardTitle>
            <CardDescription>
              {preview.importable} filas preparadas de {preview.totalRows}; se agruparán por empresa en accesos planificados. {preview.issues.length} filas se omitirán.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {preview.records.length ? (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Fila</TableHead><TableHead>Empresa</TableHead><TableHead>Trabajador</TableHead><TableHead>DNI/NIE</TableHead><TableHead>Área</TableHead><TableHead>Tarea</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {preview.records.map((row) => <TableRow key={`${row.rowNumber}-${row.legalId}`}>
                    <TableCell>{row.rowNumber}</TableCell><TableCell>{row.company}</TableCell><TableCell>{row.worker}</TableCell><TableCell>{row.legalId}</TableCell><TableCell>{row.area}</TableCell><TableCell>{row.task}</TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">No hay filas válidas para importar.</p>}
            {preview.truncated ? <p className="text-sm text-muted-foreground">Se muestran las primeras 100 filas válidas.</p> : null}
            {preview.issues.length ? (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">Filas que se omitirán</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Fila</TableHead><TableHead>Registro</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
                  <TableBody>{preview.issues.map((item, index) => <TableRow key={`${item.rowNumber}-${index}`}>
                    <TableCell>{item.rowNumber}</TableCell><TableCell>{item.label}</TableCell><TableCell>{item.reason}</TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
