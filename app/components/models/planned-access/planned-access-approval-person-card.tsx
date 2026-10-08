import { useState } from "react";
import { useFetcher } from "react-router";
import { CheckIcon, XIcon } from "lucide-react";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { FieldGroup } from "~/components/ui/field";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Textarea } from "~/components/ui/textarea";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

export default function PlannedAccessApprovalPersonCard({ person, updatedAt, actionPath, companyValidated, pending }: {
  person: PlannedAccessListItem["plannedAccessPersons"][number];
  updatedAt: Date;
  actionPath: string;
  companyValidated: boolean;
  pending: boolean;
}) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const [rejecting, setRejecting] = useState(false);
  const decision = person.decision?.accessDecision ?? "PENDING";
  const decided = decision !== "PENDING";
  const busy = fetcher.state !== "idle";
  const name = [person.firstNameSnapshot, person.middleNameSnapshot, person.lastNameSnapshot, person.secondLastNameSnapshot].filter(Boolean).join(" ");
  return (
    <Card size="sm">
      <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
      <CardContent>
        <p>DNI: {person.legalIdSnapshot}</p>
        {decided ? <div className="flex flex-col items-start gap-2">
          <Badge variant={decision === "APPROVED" ? "default" : "destructive"}>
            {decision === "APPROVED" ? "Aprobado" : "Rechazado"}
          </Badge>
          {person.decision?.decisionReason ? <p>{person.decision.decisionReason}</p> : null}
        </div> : null}
      </CardContent>
      {!decided && pending ? <CardFooter>
        <fetcher.Form method="post" action={actionPath} className="flex w-full flex-col gap-4">
          <input type="hidden" name="intent" value="review-person" />
          <input type="hidden" name="personId" value={person.id} />
          <input type="hidden" name="expectedUpdatedAt" value={new Date(updatedAt).toISOString()} />
          {fetcher.data?.errors ? <Alert variant="destructive"><AlertDescription>{getActionErrorMessage(fetcher.data.errors)}</AlertDescription></Alert> : null}
          {rejecting ? <FieldGroup>
            <FieldWrapper label="Motivo del rechazo *" htmlFor={`reason-${person.id}`}>
              <Textarea id={`reason-${person.id}`} name="reason" required autoFocus />
            </FieldWrapper>
          </FieldGroup> : null}
          <div className="flex flex-wrap gap-2">
            {rejecting ? <>
              <Button type="submit" name="decision" value="DENIED" variant="destructive" disabled={busy}>Confirmar rechazo</Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setRejecting(false)}>Cancelar</Button>
            </> : <>
              <Button type="submit" name="decision" value="APPROVED" disabled={busy || !companyValidated}>
                <CheckIcon data-icon="inline-start" />Aprobar
              </Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={() => setRejecting(true)}>
                <XIcon data-icon="inline-start" />Rechazar
              </Button>
            </>}
          </div>
        </fetcher.Form>
      </CardFooter> : null}
    </Card>
  );
}
