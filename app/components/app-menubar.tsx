import { LogOutIcon } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem as MenubarActionItem,
  MenubarMenu,
  MenubarTrigger,
} from "./ui/menubar";
import { NavLink, useSubmit } from "react-router";

export type MenubarItem = {
  label: string;
  children: Array<{
    label: string;
    href: string;
    children?: Array<{
      label: string;
      href: string;
    }>;
  }>;
};

interface AppMenubarProps {
  items: MenubarItem[];
}

export default function AppMenubar({ items }: AppMenubarProps) {
  const submit = useSubmit();

  return (
    <Menubar className="max-w-fit">
      {items.map((item) => (
        <MenubarMenu key={item.label}>
          <MenubarTrigger>{item.label}</MenubarTrigger>
          <MenubarContent align="center">
            {item.children.map((child) => (
              <MenubarActionItem key={child.href} asChild>
                <NavLink to={child.href}>{child.label}</NavLink>
              </MenubarActionItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
      <MenubarMenu>
        <MenubarTrigger>Cuenta</MenubarTrigger>
        <MenubarContent align="center">
          <MenubarActionItem
            onSelect={() =>
              submit({}, { method: "post", action: "/auth/logout" })
            }
          >
            <LogOutIcon />
            Cerrar sesión
          </MenubarActionItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
