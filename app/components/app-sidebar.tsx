import { ChevronDown, LogOutIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Separator } from "./ui/separator";

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
  title?: string;
  items: Array<SidebarLinkItem>;
}

function hasChildren(item: SidebarLinkItem): item is SidebarGroupLinks {
  return "children" in item;
}

export default function AppSidebar({
  title = "Wachiman app",
  items,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="m-2">
        <span className="font-bold text-4xl md:text-2xl">{title}</span>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="px-2">
        {items.length > 0
          ? items.map((item) =>
              hasChildren(item) ? (
                <Collapsible
                  key={item.label}
                  defaultOpen
                  className="group/collapsible my-2"
                >
                  <SidebarGroup>
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger>
                        <span className="font-semibold text-2xl md:text-lg">
                          {item.label}
                        </span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarGroupContent className="mt-2">
                        <SidebarMenu>
                          {item.children.map((child) => (
                            <SidebarMenuItem key={child.href} className="my-1">
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={child.href}
                                  className="text-xl md:text-base"
                                >
                                  {child.label}
                                </NavLink>
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
      <Separator />
      <SidebarFooter className="w-full items-center">
        <Form method="post" action="/auth/logout" className="w-full">
          <Button
            type="submit"
            variant="ghost"
            className="w-full text-base gap-2"
          >
            <LogOutIcon className="size-4" />
            Cerrar sesión
          </Button>
        </Form>
      </SidebarFooter>
    </Sidebar>
  );
}
