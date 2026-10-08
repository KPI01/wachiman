import { PlusIcon } from "lucide-react";
import { useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { FieldGroup } from "~/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Site } from "../../../../db/schema";
import { Button } from "~/components/ui/button";

export default function CreateAllowedAreaForm({
  errors: actionErrors,
  sites,
  actionPath = "/admin/allowed-areas",
}: {
  errors?: unknown;
  sites: Array<Pick<Site, "id" | "name">>;
  actionPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const errors = fetcher.data?.errors ?? actionErrors;
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setOpen(false);
      toast.success("Área autorizada creada correctamente.");
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon data-icon="inline-start" />
          <span className="text-base">Área</span>
        </>
      }
      title="Alta de área autorizada"
      description="Selecciona el centro al que pertenece el área autorizada."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <Button type="submit" form="create-allowed-area" disabled={!sites.length || fetcher.state !== "idle"}>
            Crear área
          </Button>
        </>
      }
    >
      <fetcher.Form
        id="create-allowed-area"
        method="post"
        action={actionPath}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <FieldWrapper label="Centro" htmlFor="area-site" errors={getFieldErrors(errors, "siteId")}>
            <Select name="siteId" defaultValue={sites[0]?.id} required disabled={!sites.length}>
              <SelectTrigger id="area-site" aria-invalid={Boolean(getFieldErrors(errors, "siteId"))}>
                <SelectValue placeholder="Selecciona un centro..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {!sites.length ? <p className="text-sm text-muted-foreground">Crea un centro antes de añadir áreas.</p> : null}
          </FieldWrapper>
          <FieldWrapper label="Nombre" htmlFor="name" errors={getFieldErrors(errors, "name")}>
            <Input id="name" name="name" required aria-invalid={Boolean(getFieldErrors(errors, "name"))} />
          </FieldWrapper>
        </FieldGroup>
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
