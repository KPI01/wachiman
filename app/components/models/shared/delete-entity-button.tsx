import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";

type DeleteEntityButtonProps = {
  id: string;
  action: string;
  label: string;
  onDeleted?: () => void;
};

export default function DeleteEntityButton({
  id,
  action,
  label,
  onDeleted,
}: DeleteEntityButtonProps) {
  const fetcher = useFetcher<{ success?: boolean }>();
  const onDeletedRef = useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  useEffect(() => {
    if (fetcher.data?.success) onDeletedRef.current?.();
  }, [fetcher.data]);

  return (
    <fetcher.Form method="delete" action={action}>
      <input name="id" value={id} type="hidden" readOnly />
      <Button
        type="submit"
        variant="destructive"
        disabled={fetcher.state !== "idle"}
      >
        {fetcher.state !== "idle" ? (
          <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
        ) : (
          <Trash2Icon data-icon="inline-start" />
        )}
        {fetcher.state !== "idle" ? "Eliminando…" : label}
      </Button>
    </fetcher.Form>
  );
}
