import { MessageCircle, Users, Settings, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Conversas",
    url: "/",
    icon: MessageCircle,
    testId: "link-conversations",
  },
  {
    title: "Contatos",
    url: "/contacts",
    icon: Users,
    testId: "link-contacts",
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    testId: "link-settings",
  },
];

interface AppSidebarProps {
  onToggle?: () => void;
}

export function AppSidebar({ onToggle }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-2">
          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Alternar menu</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
