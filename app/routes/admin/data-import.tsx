import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import type { Route } from "./+types/data-import";
import { validateUserRole } from "~/lib/auth.server";
import { getDataImportSites, importData, isImportType, previewDataImport } from "~/lib/services/data-import.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Checkbox } from "~/components/ui/checkbox";

type ImportType = "companies" | "workers" | "workCategories" | "allowedAreas";

const IMPORT_TYPES: Array<{ value: ImportType; label: string; description: string }> = [
  { value: "companies", label: "Empresas", description: "Importa nombres de empresa. Las existentes se omiten." },
  { value: "workers", label: "Trabajadores externos", description: "Importa trabajador, DNI y empresa; vincula un tipo de trabajo ya existente. Importa primero las tareas y las áreas autorizadas por separado." },
  { value: "workCategories", label: "Tipos de trabajo", description: "Importa los valores de «Tareas a realizar». Los requisitos de seguridad empiezan activados; revísalos fila a fila antes de guardar." },
  { value: "allowedAreas", label: "Áreas autorizadas", description: "Importa los lugares autorizados al centro seleccionado. Después se asignan en los accesos planificados." },
];

type PreviewData = {
  totalRows: number;
  importable: number;
  issues: Array<{ rowNumber: number; label: string; reason: string }>;
  records: Array<{ rowNumber: number; company: string; worker: string; legalId: string; area: string; task: string }>;
  truncated: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");
  const url = new URL(request.url);
  const requestedType = url.searchParams.get("type");
  return {
    sites: await getDataImportSites(),
    initialType: IMPORT_TYPES.some((type) => type.value === requestedType) ? requestedType as ImportType : "workers" as const,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const formData = await request.formData();
  const file = formData.get("file");
  const typeValue = formData.get("type");
  const siteId = String(formData.get("siteId") ?? "") || undefined;
  const intent = formData.get("intent");
  if (!(file instanceof File) || !isImportType(typeValue)) {
    return { success: false as const, error: "Selecciona un archivo y el tipo de datos que quieres importar." };
  }
  try {
    if (intent === "preview") {
      return { success: true as const, intent, type: typeValue, fileName: file.name, preview: await previewDataImport({ file, type: typeValue, siteId }) };
    }
    if (intent === "import") {
      const rawRequirements = formData.get("workCategoryRequirements");
      let workCategoryRequirements;
      if (typeValue === "workCategories" && typeof rawRequirements === "string") {
        const parsed = JSON.parse(rawRequirements) as Record<string, unknown>;
        workCategoryRequirements = Object.fromEntries(Object.entries(parsed).map(([key, value]) => {
          if (!value || typeof value !== "object") throw new Error("Revisa los requisitos de cada tipo de trabajo.");
          const flags = value as Record<string, unknown>;
          if (![flags.requiresTraining, flags.requiresSpecialPermission, flags.requiresWorkPermit].every((flag) => typeof flag === "boolean")) {
            throw new Error("Revisa los requisitos de cada tipo de trabajo.");
          }
          return [key, flags];
        })) as Record<string, { requiresTraining: boolean; requiresSpecialPermission: boolean; requiresWorkPermit: boolean }>;
      }
      return { success: true as const, intent, type: typeValue, fileName: file.name, result: await importData({ file, type: typeValue, siteId, changedBy: user.id, workCategoryRequirements }) };
    }
    return { success: false as const, error: "La acción de importación no es válida." };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "No se pudo procesar el archivo." };
  }
}

export default function DataImportPage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();
  const [type, setType] = useState<ImportType>(loaderData.initialType);
  const [siteId, setSiteId] = useState(loaderData.sites[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workCategoryRequirements, setWorkCategoryRequirements] = useState<Record<string, {
    requiresTraining: boolean;
    requiresSpecialPermission: boolean;
    requiresWorkPermit: boolean;
  }>>({});
  const data = fetcher.data;
  const selectedType = IMPORT_TYPES.find((item) => item.value === type)!;
  const isBusy = fetcher.state !== "idle";
  const preview = data?.success && data.intent === "preview" && data.type === type && data.fileName === file?.name
    ? data.preview as PreviewData
    : null;
  const result = data?.success && data.intent === "import" ? data.result : null;

  useEffect(() => {
    if (!preview || type !== "workCategories") return;
    setWorkCategoryRequirements(Object.fromEntries(preview.records.map((row) => [row.task.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es"), {
      requiresTraining: true,
      requiresSpecialPermission: true,
      requiresWorkPermit: true,
    }])));
  }, [preview, type]);

  useEffect(() => {
    if (result) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [result]);

  function submit(intent: "preview" | "import") {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("siteId", siteId);
    formData.append("intent", intent);
    if (intent === "import" && type === "workCategories") formData.append("workCategoryRequirements", JSON.stringify(workCategoryRequirements));
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/admin/companies"><ArrowLeft /> Volver a datos maestros</Link>
          </Button>
          <h1 className="text-3xl font-bold">Importar datos</h1>
          <p className="mt-1 text-muted-foreground">Carga datos desde Excel o CSV con vista previa y control de duplicados.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archivo de origen</CardTitle>
          <CardDescription>Se reconocen las columnas Empresa, Trabajador, DNI, Lugar de trabajo autorizado y Tareas a realizar. El límite es de 10 MB. La importación solo crea entradas de catálogo; no genera ni aprueba accesos planificados.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-type">Tipo de datos</Label>
              <Select value={type} onValueChange={(value) => { if (value) setType(value as ImportType); }}>
                <SelectTrigger id="import-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPORT_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{selectedType.description}</p>
            </div>
            {type === "allowedAreas" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-site">Centro</Label>
                <Select value={siteId} onValueChange={(value) => setSiteId(value ?? "")}>
                  <SelectTrigger id="import-site"><SelectValue placeholder="Seleccionar centro" /></SelectTrigger>
                  <SelectContent>
                    {loaderData.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">Archivo Excel o CSV</Label>
            <Input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
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
                Se crearon {result.imported} registros; se omitieron {result.skipped} duplicados o filas incompletas.
                {result.createdDependencies ? ` También se crearon ${result.createdDependencies} empresas vinculadas a los trabajadores.` : ""}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!file || isBusy || (type === "allowedAreas" && !siteId)} onClick={() => submit("preview")}>
              <FileSpreadsheet /> {isBusy && fetcher.formData?.get("intent") === "preview" ? "Leyendo archivo…" : "Mostrar vista previa"}
            </Button>
            <Button type="button" disabled={!file || !preview?.importable || isBusy || (type === "allowedAreas" && !siteId)} onClick={() => submit("import")}>
              <Upload /> {isBusy && fetcher.formData?.get("intent") === "import" ? "Importando…" : "Importar registros válidos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>
              {preview.importable} filas preparadas de {preview.totalRows}. {preview.issues.length} filas se omitirán por datos incompletos o repetidos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {preview.records.length ? (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Fila</TableHead>
                  {type === "companies" ? <TableHead>Empresa</TableHead> : null}
                  {type === "workers" ? <><TableHead>Trabajador</TableHead><TableHead>DNI</TableHead><TableHead>Empresa</TableHead><TableHead>Tarea</TableHead></> : null}
                  {type === "workCategories" ? <><TableHead>Tarea</TableHead><TableHead>Formación</TableHead><TableHead>Autorización especial</TableHead><TableHead>Permiso de trabajo</TableHead></> : null}
                  {type === "allowedAreas" ? <TableHead>Lugar autorizado</TableHead> : null}
                </TableRow></TableHeader>
                <TableBody>
                  {preview.records.map((row) => <TableRow key={`${row.rowNumber}-${row.legalId || row.company || row.area || row.task}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    {type === "companies" ? <TableCell>{row.company}</TableCell> : null}
                    {type === "workers" ? <><TableCell>{row.worker}</TableCell><TableCell>{row.legalId}</TableCell><TableCell>{row.company}</TableCell><TableCell>{row.task}</TableCell></> : null}
                    {type === "workCategories" ? <>
                      <TableCell>{row.task}</TableCell>
                      {([
                        ["requiresTraining", "Requiere formación"],
                        ["requiresSpecialPermission", "Requiere autorización especial"],
                        ["requiresWorkPermit", "Requiere permiso de trabajo"],
                      ] as const).map(([flag, label]) => {
                        const key = row.task.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
                        return <TableCell key={flag}><Label className="flex items-center gap-2"><Checkbox
                          checked={workCategoryRequirements[key]?.[flag] ?? true}
                          onCheckedChange={(checked) => setWorkCategoryRequirements((current) => ({
                            ...current,
                            [key]: { ...(current[key] ?? { requiresTraining: true, requiresSpecialPermission: true, requiresWorkPermit: true }), [flag]: checked === true },
                          }))}
                        /><span className="sr-only">{label} para {row.task}</span></Label></TableCell>;
                      })}
                    </> : null}
                    {type === "allowedAreas" ? <TableCell>{row.area}</TableCell> : null}
                  </TableRow>)}
                </TableBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">No se encontraron filas válidas para este tipo de datos.</p>}
            {preview.truncated ? <p className="text-sm text-muted-foreground">Se muestran las primeras 100 filas válidas.</p> : null}
            {preview.issues.length ? (
              <div className="flex flex-col gap-2">
                <h2 className="font-semibold">Filas que se omitirán</h2>
                <ul className="max-h-52 list-inside list-disc overflow-auto text-sm text-muted-foreground">
                  {preview.issues.slice(0, 100).map((issue, index) => <li key={`${issue.rowNumber}-${index}`}>Fila {issue.rowNumber} · {issue.label}: {issue.reason}</li>)}
                </ul>
                {preview.issues.length > 100 ? <p className="text-sm text-muted-foreground">Se muestran las primeras 100 incidencias.</p> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
