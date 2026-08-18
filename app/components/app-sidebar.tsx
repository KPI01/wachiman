import { ChevronDown, LogOutIcon, type LucideIcon } from "lucide-react";
import { Form, useLocation } from "react-router";
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
import { useAppConfig } from "~/lib/app-config";

type SidebarLink = {
  label: string;
  href: string;
  icon?: LucideIcon;
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

function SidebarNavLink({ item }: { item: SidebarLink }) {
  const Icon = item.icon;
  const location = useLocation();
  const itemPath = item.href.split("?")[0];
  const isActive =
    itemPath === "/admin" ||
    itemPath === "/security" ||
    itemPath === "/approver" ||
    itemPath === "/requester" ||
    itemPath === "/operator" ||
    itemPath === "/monitor"
      ? location.pathname === itemPath
      : location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);

  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <NavLink to={item.href}>
        {Icon ? <Icon data-icon="inline-start" /> : null}
        <span>{item.label}</span>
      </NavLink>
    </SidebarMenuButton>
  );
}

export default function AppSidebar({
  title,
  items,
  ...props
}: AppSidebarProps) {
  const { appName } = useAppConfig();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="m-2">
        <span className="font-bold text-4xl md:text-2xl">{title ?? appName}</span>
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
                              <SidebarNavLink item={child} />
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
                        <SidebarNavLink item={item} />
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
