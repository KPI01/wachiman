type WorkRiskPreviewProps = {
  siteName: string;
  siteAddress?: string | null;
  facilityRiskInformation?: string | null;
  workCategoryName?: string | null;
  workCategoryRiskInformation?: string | null;
  companyName?: string | null;
  workerName?: string | null;
  legalId?: string | null;
  taskDescription?: string | null;
  workArea?: string | null;
};

export default function WorkRiskPreview({
  siteName,
  siteAddress,
  facilityRiskInformation,
  workCategoryName,
  workCategoryRiskInformation,
  companyName,
  workerName,
  legalId,
  taskDescription,
  workArea,
}: WorkRiskPreviewProps) {
  return (
    <article className="flex flex-col gap-6 rounded-lg border bg-background px-4 py-6 sm:px-8">
      <header className="border-b pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Información preventiva del trabajo
        </p>
        <h2 className="mt-2 text-2xl font-bold">{siteName}</h2>
        {siteAddress ? <p className="mt-1 text-sm text-muted-foreground">{siteAddress}</p> : null}
      </header>

      <section className="grid gap-5 border-b pb-5 sm:grid-cols-2">
        {companyName ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa contratista</p>
            <p className="mt-2 font-medium">{companyName}</p>
          </div>
        ) : null}
        {workerName ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Persona informada</p>
            <p className="mt-2 font-medium">{workerName}</p>
            {legalId ? <p className="text-sm text-muted-foreground">DNI/NIE: {legalId}</p> : null}
          </div>
        ) : null}
        {taskDescription ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trabajo a realizar</p>
            <p className="mt-2 whitespace-pre-wrap">{taskDescription}</p>
          </div>
        ) : null}
        {workArea ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zona de trabajo</p>
            <p className="mt-2 whitespace-pre-wrap">{workArea}</p>
          </div>
        ) : null}
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Riesgos generales del centro</h3>
        <p className="whitespace-pre-wrap leading-7">{facilityRiskInformation || "No hay riesgos generales configurados para este centro."}</p>
      </section>

      {workCategoryRiskInformation ? (
        <section className="border-t pt-6">
          <h3 className="mb-2 text-lg font-semibold">
            Riesgos del tipo de trabajo{workCategoryName ? `: ${workCategoryName}` : ""}
          </h3>
          <p className="whitespace-pre-wrap leading-7">{workCategoryRiskInformation}</p>
        </section>
      ) : null}
    </article>
  );
}
