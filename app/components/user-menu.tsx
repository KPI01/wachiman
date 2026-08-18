import {
  ChevronsUpDownIcon,
  CircleUserRoundIcon,
  LogOutIcon,
} from "lucide-react";
import { useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SidebarMenuButton } from "~/components/ui/sidebar";
import { USER_ROLES } from "~/lib/models/user";
import type { SessionUser } from "~/lib/session.server";

type UserMenuProps = {
  user: SessionUser;
  variant?: "sidebar" | "header";
};

function UserIdentity({ user }: { user: SessionUser }) {
  return (
    <>
      <CircleUserRoundIcon aria-hidden="true" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">{user.username}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {user.role ? USER_ROLES[user.role] : "Sin rol"}
        </span>
      </span>
      <ChevronsUpDownIcon className="ml-auto" aria-hidden="true" />
    </>
  );
}

export default function UserMenu({
  user,
  variant = "header",
}: UserMenuProps) {
  const submit = useSubmit();
  const trigger =
    variant === "sidebar" ? (
      <SidebarMenuButton
        size="lg"
        className="w-full"
        aria-label="Abrir menú de usuario"
      >
        <UserIdentity user={user} />
      </SidebarMenuButton>
    ) : (
      <Button
        type="button"
        variant="outline"
        className="h-auto min-w-48 justify-start"
        aria-label="Abrir menú de usuario"
      >
        <UserIdentity user={user} />
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={variant === "sidebar" ? "top" : "bottom"}
        className="min-w-48"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() =>
              submit({}, { method: "post", action: "/auth/logout" })
            }
          >
            <LogOutIcon aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
