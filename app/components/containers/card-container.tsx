import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "~/lib/utils";

interface CardContainerProps {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function CardContainer({
  className,
  title,
  description,
  children,
  footer,
}: CardContainerProps) {
  return (
    <Card className={cn("border border-accent", className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="uppercase">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="flex justify-end">{footer}</CardFooter>}
    </Card>
  );
}
