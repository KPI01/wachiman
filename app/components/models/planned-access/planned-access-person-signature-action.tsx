import { AlertTriangleIcon, PenLineIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, { AlertDialogCancel } from "~/components/containers/alert-dialog-container";
import AccessLogSignature from "~/components/models/access-logs/access-log-signature";
import RiskInformationPreview from "~/components/models/access-logs/risk-information-preview";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type PlannedAccessPerson = PlannedAccessListItem["plannedAccessPersons"][number];

type Props = {
  plannedAccessId: string;
  person: PlannedAccessPerson;
  disabled?: boolean;
  site: { id: string; name: string; address?: string | null; riskInformation?: string | null };
  holder?: { legalName: string; taxId: string; fiscalAddress: string };
  company?: { id: string; name: string; cif: string; address?: string | null };
  dailyRiskAcknowledgements?: Array<{ legalIdSnapshot: string; companyId: string | null; siteId: string; riskAcknowledgedAt: Date | null }>;
};

function getPersonFullName(person: PlannedAccessPerson) {
  return [person.firstNameSnapshot, person.middleNameSnapshot, person.lastNameSnapshot, person.secondLastNameSnapshot].filter(Boolean).join(" ");
}

export default function PlannedAccessPersonSignatureAction({ plannedAccessId, person, disabled = false, site, holder, company, dailyRiskAcknowledgements = [] }: Props) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"documentation" | "signature">("documentation");
  const [hasSignature, setHasSignature] = useState(false);
  const [entrySignaturePayload, setEntrySignaturePayload] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const formId = `planned-access-signature-${plannedAccessId}-${person.id}`;
  const errorMessage = typeof fetcher.data?.errors === "string" ? fetcher.data.errors : fetcher.data?.errors ? "No se pudo registrar el acceso planificado." : null;
  const canReuseDailyAcknowledgement = Boolean(company && dailyRiskAcknowledgements.some((entry) => entry.legalIdSnapshot.toUpperCase() === person.legalIdSnapshot.toUpperCase() && entry.companyId === company.id && entry.siteId === site.id && entry.riskAcknowledgedAt !== null));

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }
    toast.success("Acceso registrado correctamente");
    setOpen(false);
    setStep("documentation");
    setHasSignature(false);
    setEntrySignaturePayload("");
    setRiskAcknowledged(false);
  }, [fetcher.data, fetcher.state]);

  function reset() {
    setStep("documentation");
    setHasSignature(false);
    setEntrySignaturePayload("");
    setRiskAcknowledged(false);
  }

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) { reset(); if (canReuseDailyAcknowledgement) { setStep("signature"); setRiskAcknowledged(true); } } }}
      triggerAsChild
      buttonLabel={<Button type="button" size="sm" variant="outline" disabled={disabled}><PenLineIcon data-icon="inline-start" />Solicitar firma</Button>}
      title={step === "documentation" ? "Información y validación" : "Firma para acceso planificado"}
      description={step === "documentation" ? "Revisa el documento y confirma la información antes de continuar." : `Solicita la firma de ${getPersonFullName(person)} para registrar su ingreso.`}
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          {step === "documentation" ? (
            <Button type="button" onClick={() => setStep("signature")} disabled={!riskAcknowledged}>Continuar a la firma</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("documentation")}>Volver</Button>
              <Button type="submit" form={formId} disabled={!hasSignature || !riskAcknowledged || fetcher.state !== "idle"}>{fetcher.state === "submitting" ? "Enviando..." : "Registrar acceso"}</Button>
            </>
          )}
        </>
      }
    >
      <fetcher.Form id={formId} method="post" action="/operator?index" className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <input type="hidden" name="intent" value="planned-access-signature" />
        <input type="hidden" name="plannedAccessId" value={plannedAccessId} />
        <input type="hidden" name="plannedAccessPersonId" value={person.id} />
        <input type="hidden" name="entrySignaturePayload" value={entrySignaturePayload} />
        <input type="hidden" name="riskInformationAcknowledged" value={riskAcknowledged ? "true" : "false"} />
        {errorMessage ? <Alert variant="destructive"><AlertTriangleIcon /><AlertTitle>Error</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
        <div className="rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">{getPersonFullName(person)}</p><p className="text-muted-foreground">DNI/NIE: {person.legalIdSnapshot}</p></div>
        {step === "documentation" ? (
          <>
            {holder && company && site.riskInformation ? <RiskInformationPreview holderLegalName={holder.legalName} holderTaxId={holder.taxId} holderFiscalAddress={holder.fiscalAddress} siteName={site.name} siteAddress={site.address} riskInformation={site.riskInformation} companyName={company.name} companyCif={company.cif} companyAddress={company.address ?? ""} workerName={getPersonFullName(person)} legalId={person.legalIdSnapshot} /> : <Alert variant="destructive"><AlertTriangleIcon /><AlertTitle>Información incompleta</AlertTitle><AlertDescription>No se puede mostrar el documento porque faltan datos legales o de riesgos.</AlertDescription></Alert>}
            <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm"><Checkbox checked={riskAcknowledged} onCheckedChange={(checked) => setRiskAcknowledged(checked === true)} /><span>Confirmo que he leído este documento y que he sido informado de los riesgos e instrucciones preventivas indicados.</span></label>
          </>
        ) : <AccessLogSignature key={`planned-entry-signature-${open}-${person.id}`} onSignatureChange={setHasSignature} onSignaturePayloadChange={setEntrySignaturePayload} />}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
