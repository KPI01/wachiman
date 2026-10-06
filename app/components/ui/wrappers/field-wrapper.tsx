import type { ComponentProps, ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "../field";
import { cn } from "~/lib/utils";

interface FieldWrapperProps {
  orientation?: ComponentProps<typeof Field>["orientation"];
  label: string;
  htmlFor: ComponentProps<typeof FieldLabel>["htmlFor"];
  children: ReactNode;
  errors?: string[];
  className?: string;
}

export default function FieldWrapper({
  orientation,
  htmlFor,
  label,
  children,
  errors,
  className,
}: FieldWrapperProps) {
  const hasErrors = errors && errors.length > 0;

  return (
    <Field
      orientation={orientation}
      data-invalid={hasErrors ? "true" : undefined}
      className={cn(
        orientation === "horizontal"
          ? "grid grid-cols-1 sm:grid-cols-[1fr_12rem]"
          : "",
        className,
      )}
    >
      <FieldLabel htmlFor={htmlFor}>
        {label}
      </FieldLabel>
      {children}
      {hasErrors && (
        <FieldError
          id={`${htmlFor}-error`}
          errors={errors.map((message) => ({ message }))}
        />
      )}
    </Field>
  );
}
