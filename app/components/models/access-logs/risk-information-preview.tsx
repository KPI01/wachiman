type RiskInformationPreviewProps = {
  holderLegalName: string;
  holderTaxId: string;
  holderFiscalAddress: string;
  siteName: string;
  siteAddress?: string | null;
  facilityRiskInformation?: string | null;
  facilityRiskInformationVersion?: number | null;
  companyName: string;
  companyCif: string;
  companyAddress: string;
  workerName: string;
  legalId: string;
};

export default function RiskInformationPreview(
  props: RiskInformationPreviewProps,
) {
  return (
    <article className="flex flex-col gap-8 bg-background px-4 py-6 sm:px-8">
      <section className="border-b pb-6">
        <p className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          {props.holderLegalName}
        </p>
        <p className="mt-3 text-sm">NIF/CIF: {props.holderTaxId}</p>
        <p className="text-sm">{props.holderFiscalAddress}</p>
      </section>

      <section className="grid gap-6 border-b pb-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Centro</p>
          <p className="mt-2 font-medium">{props.siteName}</p>
          <p className="text-sm text-muted-foreground">{props.siteAddress}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa contratista</p>
          <p className="mt-2 font-medium">{props.companyName}</p>
          <p className="text-sm text-muted-foreground">CIF: {props.companyCif}</p>
          <p className="text-sm text-muted-foreground">{props.companyAddress}</p>
        </div>
      </section>

      <section className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Persona que firma</p>
        <p className="mt-2 font-medium">{props.workerName}</p>
        <p className="text-sm text-muted-foreground">DNI/NIE: {props.legalId}</p>
      </section>

      <section className="whitespace-pre-wrap text-base leading-8 sm:text-lg">
        <p>
          El personal de <strong>{props.companyName}</strong>, viene por cuenta de <strong>{props.companyName}</strong> a realizar trabajos esporádicos en <strong>{props.holderLegalName}</strong>.
        </p>
        <p className="mt-8">
          A la firma del presente documento certifico que he recibido por parte de mi empresa la información y las instrucciones correspondientes para la intervención que he de realizar en las instalaciones de <strong>{props.holderLegalName}</strong>.
        </p>
      </section>

      <section className="border-t pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Riesgos generales del centro
          {props.facilityRiskInformationVersion
            ? ` · versión ${props.facilityRiskInformationVersion}`
            : ""}
        </p>
        <p className="mt-3 whitespace-pre-wrap leading-7">
          {props.facilityRiskInformation ||
            "No hay información de riesgos configurada para este centro."}
        </p>
      </section>

    </article>
  );
}
