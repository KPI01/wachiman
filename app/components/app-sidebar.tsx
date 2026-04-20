import { ChevronDown, LogOutIcon } from "lucide-react";
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
import { Form, NavLink } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";

type SidebarLink = {
  label: string;
  href: string;
};

type SidebarGroupLinks = {
  label: string;
  children: SidebarLink[];
};

export type SidebarLinkItem = SidebarLink | SidebarGroupLinks;

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  items: Array<SidebarLinkItem>;
}

function hasChildren(item: SidebarLinkItem): item is SidebarGroupLinks {
  return "children" in item;
}

export default function AppSidebar({ items, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <span className="font-bold text-xl">Wachiman app</span>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {items.length > 0
          ? items.map((item) =>
              hasChildren(item) ? (
                <Collapsible
                  key={item.label}
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarGroup>
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger>
                        <span className="font-semibold text-sm">
                          {item.label}
                        </span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {item.children.map((child) => (
                            <SidebarMenuItem key={child.href}>
                              <SidebarMenuButton asChild>
                                <NavLink to={child.href}>{child.label}</NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              ) : (
                <SidebarGroup key={item.href}>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href}>{item.label}</NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ),
            )
          : "Sin elementos"}
      </SidebarContent>
      <SidebarFooter className="w-full items-center">
        <Form method="post" action="/logout" className="w-full">
          <Button type="submit" variant="ghost" className="w-full">
            <LogOutIcon />
            Cerrar sesión
          </Button>
        </Form>
      </SidebarFooter>
    </Sidebar>
  );
}
