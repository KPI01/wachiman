import { PrinterIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import WorkRiskPreview from "~/components/models/access-logs/work-risk-preview";

export type WorkPermitPreviewData = {
  id: string;
  firstNameSnapshot: string;
  lastNameSnapshot: string;
  legalIdSnapshot: string;
  restrictions: string | null;
  workCategoryName?: string | null;
  workCategoryRiskSnapshot?: string | null;
  activity: {
    companySnapshot: string;
    taskDescription: string;
    workAreaSnapshot: string;
    riskItems: Array<{ title: string; measures: string }>;
    toolsAndEquipment: string;
    personalProtectiveEquipment: string;
    facilityRiskSnapshot: string;
    site?: { name: string; address: string | null } | null;
  };
  workCategory?: { name: string } | null;
};

type WorkPermitPreviewProps = { workPermit: WorkPermitPreviewData };

export default function WorkPermitPreview({ workPermit }: WorkPermitPreviewProps) {
  const { activity } = workPermit;
  const legacyRiskInformation = activity.riskItems
    .map((risk) => `${risk.title}\n${risk.measures}`)
    .join("\n\n");

  return (
    <article className="flex flex-col gap-5 rounded-lg border bg-background p-4 text-sm sm:p-6">
      <header className="border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Permiso de trabajo
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="mt-2 text-xl font-bold">{activity.companySnapshot}</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />Imprimir
          </Button>
        </div>
        <p className="mt-1">
          {workPermit.firstNameSnapshot} {workPermit.lastNameSnapshot} · DNI/NIE: {workPermit.legalIdSnapshot}
        </p>
      </header>
      <WorkRiskPreview
        siteName={activity.site?.name ?? "Centro de trabajo"}
        siteAddress={activity.site?.address}
        facilityRiskInformation={activity.facilityRiskSnapshot}
        workCategoryName={workPermit.workCategoryName ?? workPermit.workCategory?.name}
        workCategoryRiskInformation={workPermit.workCategoryRiskSnapshot ?? legacyRiskInformation}
        companyName={activity.companySnapshot}
        workerName={`${workPermit.firstNameSnapshot} ${workPermit.lastNameSnapshot}`}
        legalId={workPermit.legalIdSnapshot}
        taskDescription={activity.taskDescription}
        workArea={activity.workAreaSnapshot}
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-semibold">Herramientas y equipos</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{activity.toolsAndEquipment}</p>
        </div>
        <div>
          <p className="font-semibold">EPI</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{activity.personalProtectiveEquipment}</p>
        </div>
      </section>
      {workPermit.restrictions ? (
        <section className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
          <p className="font-semibold">Restricciones individuales</p>
          <p className="mt-1 whitespace-pre-wrap">{workPermit.restrictions}</p>
        </section>
      ) : null}
    </article>
  );
}
