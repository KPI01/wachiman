import type { ComponentProps, ReactNode } from "react";
import { Field } from "../field";
import { Label } from "../label";

interface FieldWrapperProps {
  orientation?: ComponentProps<typeof Field>["orientation"];
  label: string;
  htmlFor: ComponentProps<typeof Label>["htmlFor"];
  children: ReactNode;
}

export default function FieldWrapper({
  orientation,
  htmlFor,
  label,
  children,
}: FieldWrapperProps) {
  return (
    <Field orientation={orientation}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </Field>
  );
}
