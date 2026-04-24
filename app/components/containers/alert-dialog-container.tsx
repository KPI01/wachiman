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
import { Button, buttonVariants } from "../ui/button";

interface AlertDialogContainerProps extends PropsWithChildren {
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  buttonLabel: ReactNode;
  buttonVariant?: ComponentProps<typeof Button>["variant"];
  buttonSize?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
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
  buttonLabel,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName,
  triggerAsChild = false,
  contentClassName,
  children,
  title,
  description,
  footer,
}: AlertDialogContainerProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        asChild={triggerAsChild}
        className={
          triggerAsChild
            ? buttonClassName
            : buttonVariants({
                variant: buttonVariant,
                size: buttonSize,
                className: buttonClassName,
              })
        }
      >
        {buttonLabel}
      </AlertDialogTrigger>
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
