import type { ComponentProps } from "react";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type TableActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "asChild" | "children" | "size"
> & {
  label: string;
  icon: LucideIcon;
  to?: string;
  href?: string;
  download?: string | boolean;
  target?: "_blank";
  rel?: string;
};

export default function TableActionButton({
  label,
  icon: Icon,
  to,
  href,
  download,
  target,
  rel,
  type = "button",
  ...buttonProps
}: TableActionButtonProps) {
  const content = (
    <>
      <Icon aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
  const button = to ? (
    <Button {...buttonProps} size="icon-sm" aria-label={label} asChild>
      <Link to={to}>{content}</Link>
    </Button>
  ) : href ? (
    <Button {...buttonProps} size="icon-sm" aria-label={label} asChild>
      <a
        href={href}
        download={download}
        target={target}
        rel={rel}
      >
        {content}
      </a>
    </Button>
  ) : (
    <Button
      {...buttonProps}
      type={type}
      size="icon-sm"
      aria-label={label}
    >
      {content}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
