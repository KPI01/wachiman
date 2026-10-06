import { InfoIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteSiteBtn from "~/components/models/site/delete-site-btn";
import type { Site } from "../../../../db/schema";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type SiteDetailsProps = {
  site: Site;
  actionPath?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  canDelete?: boolean;
};

type SiteFormValues = {
  name: string;
  riskInformation: string;
  slug: string;
  address: string;
};

function getSiteFormValues(site: Site): SiteFormValues {
  return {
    name: site.name,
    riskInformation: site.riskInformation ?? "",
    slug: site.slug,
    address: site.address ?? "",
  };
}

export default function SiteDetailsForm({
  site,
  actionPath = "/admin/sites",
  open,
  onOpenChange,
  showTrigger = true,
  canDelete = true,
}: SiteDetailsProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const [initialValues, setInitialValues] = useState(() => getSiteFormValues(site));
  const [formValues, setFormValues] = useState(() => getSiteFormValues(site));
  const formValuesRef = useRef(formValues);

  const formId = `site-form-${site.id}`;
  const isDirty =
    formValues.name !== initialValues.name ||
    formValues.riskInformation !== initialValues.riskInformation ||
    formValues.slug !== initialValues.slug ||
    formValues.address !== initialValues.address;

  formValuesRef.current = formValues;

  useEffect(() => {
    if (patchFetcher.data?.success) {
      setInitialValues(formValuesRef.current);
    }
  }, [patchFetcher.data]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const currentValues = getSiteFormValues(site);
      setInitialValues(currentValues);
      setFormValues(currentValues);
    }

    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setLocalOpen(nextOpen);
    }
  }

  function updateFormValue<Key extends keyof SiteFormValues>(
    key: Key,
    value: SiteFormValues[Key],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={handleOpenChange}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del centro"
      title="Ficha del centro"
      description={site.name}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      canSubmit={isDirty}
      showCancel={false}
      footerLeading={
        canDelete ? (
          <DeleteSiteBtn
            siteId={site.id}
            actionPath={actionPath === "/admin/sites" ? `/admin/sites?id=${site.id}` : actionPath}
            onDeleted={() => handleOpenChange(false)}
          />
        ) : null
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action={`${actionPath}?id=${site.id}`}
        className="grid gap-4"
      >
        <h3 className="text-sm font-semibold">Información del centro</h3>
        <Input name="id" defaultValue={site.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${site.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input
            id={`name-${site.id}`}
            name="name"
            value={formValues.name}
            onChange={(event) => updateFormValue("name", event.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Información de riesgos e instrucciones preventivas"
          htmlFor={`riskInformation-${site.id}`}
          errors={getFieldErrors(patchErrors, "riskInformation")}
        >
          <textarea
            id={`riskInformation-${site.id}`}
            name="riskInformation"
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={formValues.riskInformation}
            onChange={(event) =>
              updateFormValue("riskInformation", event.target.value)
            }
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Slug"
          htmlFor={`slug-${site.id}`}
          errors={getFieldErrors(patchErrors, "slug")}
        >
          <Input
            id={`slug-${site.id}`}
            name="slug"
            value={formValues.slug}
            onChange={(event) => updateFormValue("slug", event.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Direccion"
          htmlFor={`address-${site.id}`}
          errors={getFieldErrors(patchErrors, "address")}
        >
          <Input
            id={`address-${site.id}`}
            name="address"
            value={formValues.address}
            onChange={(event) => updateFormValue("address", event.target.value)}
          />
        </FieldWrapper>
      </patchFetcher.Form>
    </EntityDetailsDialog>
  );
}
