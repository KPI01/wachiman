import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Checkbox } from "~/components/ui/checkbox";

export default function WorkPermitApprovalFields({
  formId,
}: {
  formId: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h3 className="text-lg font-semibold">Permiso de trabajo</h3>
        <p className="text-sm text-muted-foreground">
          Estos datos se combinarán con la información general de riesgos del centro.
        </p>
      </div>
      <input type="hidden" name="formId" value={formId} />
      <FieldWrapper label="Descripción de los trabajos *" htmlFor="workPermitTaskDescription">
        <Textarea id="workPermitTaskDescription" name="workPermitTaskDescription" required />
      </FieldWrapper>
      <FieldWrapper label="Zona o ubicación de trabajo *" htmlFor="workPermitArea">
        <Textarea id="workPermitArea" name="workPermitArea" required />
      </FieldWrapper>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Herramientas y equipos *" htmlFor="workPermitTools">
          <Textarea id="workPermitTools" name="workPermitTools" required />
        </FieldWrapper>
        <FieldWrapper label="EPI utilizados *" htmlFor="workPermitPpe">
          <Textarea id="workPermitPpe" name="workPermitPpe" required />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Incidencias u observaciones" htmlFor="workPermitIncidents">
        <Textarea id="workPermitIncidents" name="workPermitIncidents" />
      </FieldWrapper>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold sm:col-span-2">Comprobaciones previas</legend>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="workPermitToolsAdequate" value="true" defaultChecked />
          Herramientas y equipos adecuados
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="workPermitProcedureKnown" value="true" defaultChecked />
          Se conoce el procedimiento de trabajo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="workPermitTrainingProvided" value="true" defaultChecked />
          Formación e información proporcionadas
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="workPermitAreaOrderly" value="true" defaultChecked />
          Entorno ordenado y limpio
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="workPermitPpeAdequate" value="true" defaultChecked />
          EPI adecuados
        </label>
      </fieldset>
    </section>
  );
}
