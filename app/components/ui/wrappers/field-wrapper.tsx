import type { ComponentProps, ReactNode } from "react";
import { Field, FieldDescription } from "../field";
import { Label } from "../label";

interface FieldWrapperProps {
  orientation?: ComponentProps<typeof Field>["orientation"];
  label: string;
  htmlFor: ComponentProps<typeof Label>["htmlFor"];
  children: ReactNode;
  errors?: string[];
}

export default function FieldWrapper({
  orientation,
  htmlFor,
  label,
  children,
  errors,
}: FieldWrapperProps) {
  const hasErrors = errors && errors.length > 0;

  return (
    <Field
      orientation={orientation}
      data-invalid={hasErrors ? "true" : undefined}
      className={
        orientation === "horizontal" ? "grid grid-cols-[1fr_12rem]" : ""
      }
    >
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hasErrors && (
        <FieldDescription className="text-destructive">
          {errors[0]}
        </FieldDescription>
      )}
    </Field>
  );
}
