import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface AlertDialogContainerProps extends PropsWithChildren {
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  showTrigger?: boolean;
  buttonLabel: ReactNode;
  buttonVariant?: ComponentProps<typeof Button>["variant"];
  buttonSize?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
  buttonDisabled?: boolean;
  buttonAriaLabel?: string;
  buttonTooltip?: string;
  triggerAsChild?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  contentClassName?: string;
  footer?: ReactNode;
}

export { AlertDialogAction, AlertDialogCancel };

export default function AlertDialogContainer({
  open = undefined,
  onOpenChange,
  showTrigger = true,
  buttonLabel,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName,
  buttonDisabled = false,
  buttonAriaLabel,
  buttonTooltip,
  triggerAsChild = false,
  contentClassName,
  children,
  title,
  description,
  footer,
}: AlertDialogContainerProps) {
  const triggerButton = triggerAsChild ? (
    buttonLabel
  ) : (
    <Button
      type="button"
      aria-label={buttonAriaLabel}
      variant={buttonVariant}
      size={buttonSize}
      className={buttonClassName}
      disabled={buttonDisabled}
    >
      {buttonLabel}
    </Button>
  );
  const trigger = (
    <AlertDialogTrigger
      asChild
      aria-label={triggerAsChild ? buttonAriaLabel : undefined}
      className={triggerAsChild ? buttonClassName : undefined}
      onClick={() => {
        if (open !== undefined) {
          onOpenChange?.(true);
        }
      }}
    >
      {triggerButton}
    </AlertDialogTrigger>
  );
  const triggerWithTooltip = buttonTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{trigger}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{buttonTooltip}</TooltipContent>
    </Tooltip>
  ) : (
    trigger
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? triggerWithTooltip : null}
      <AlertDialogContent className={contentClassName}>
        {(title || description) && (
          <AlertDialogHeader>
            {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
            {description && (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
        )}
        {children}
        {footer && <AlertDialogFooter>{footer}</AlertDialogFooter>}
      </AlertDialogContent>
    </AlertDialog>
  );
}
