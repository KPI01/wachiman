import Logout from "~/routes/logout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import type { ComponentProps } from "react";
import { NavLink } from "react-router";

export type SidebarLinkItem = {
  label: string;
  href: string;
  children?: SidebarLinkItem[];
};

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  items: Array<SidebarLinkItem>;
}

export default function AppSidebar({ items, ...props }: AppSidebarProps) {
  const someHasSubItems = items.some((item) => Object.hasOwn(item, "children"));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <span className="font-bold text-xl">Wachiman app</span>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {items.length > 0 ? (
          someHasSubItems ? (
            "Con subelementos"
          ) : (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item, ix) => (
                    <NavLink key={ix} to={item.href}>
                      <SidebarMenuItem key={ix}>
                        <SidebarMenuButton>{item.label}</SidebarMenuButton>
                      </SidebarMenuItem>
                    </NavLink>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        ) : (
          "Sin elementos"
        )}
      </SidebarContent>
      <SidebarFooter className="w-full items-center">
        <Logout />
      </SidebarFooter>
    </Sidebar>
  );
}
