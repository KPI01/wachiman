import type { ReactNode } from "react";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

type EntityDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
  trigger: ReactNode;
  triggerLabel: string;
  title: string;
  titleBadge?: ReactNode;
  description?: string;
  formId: string;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  showCancel?: boolean;
  footerLeading?: ReactNode;
  children: ReactNode;
};

export default function EntityDetailsDialog({
  open,
  onOpenChange,
  showTrigger = true,
  trigger,
  triggerLabel,
  title,
  titleBadge,
  description,
  formId,
  isSubmitting = false,
  canSubmit = true,
  showCancel = true,
  footerLeading,
  children,
}: EntityDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={triggerLabel}
            title={triggerLabel}
          >
            {trigger}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 gap-2 border-b px-6 py-5 pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            {titleBadge}
          </div>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4"
              aria-label="Cerrar ficha"
              title="Cerrar ficha"
            >
              <XIcon aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {children}
        </div>
        <DialogFooter className="shrink-0 flex-col gap-3 border-t bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          {footerLeading ? (
            <div className="order-last sm:order-none sm:mr-auto">
              {footerLeading}
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {showCancel ? (
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
            ) : null}
            <Button
              type="submit"
              form={formId}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              ) : null}
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
