import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Mail, FileText, ListChecks, BookOpen, Send, FileBarChart,
  Library, ShieldCheck, KanbanSquare, Scale, GraduationCap, Briefcase,
  Settings, User, Shield, Users, Mic, FolderHeart,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";
import { useProfile } from "@/hooks/use-profile";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getMyRoles } from "@/lib/auth.functions";

const featureItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sebenza Voice", url: "/voice", icon: Mic },
  { title: "My Workspace", url: "/workspace", icon: FolderHeart },
  { title: "Smart Email", url: "/email", icon: Mail },
  { title: "Meeting Notes", url: "/meetings", icon: FileText },
  { title: "Task Planner", url: "/tasks", icon: ListChecks },
  { title: "Research", url: "/research", icon: BookOpen },
  { title: "Follow-Up", url: "/followup", icon: Send },
  { title: "Weekly Report", url: "/report", icon: FileBarChart },
  { title: "Prompt Library", url: "/prompts", icon: Library },
  { title: "Quality Checker", url: "/quality", icon: ShieldCheck },
  { title: "Action Tracker", url: "/actions", icon: KanbanSquare },
  { title: "Decision Support", url: "/decision", icon: Scale },
  { title: "Learning", url: "/learning", icon: GraduationCap },
  { title: "Career", url: "/career", icon: Briefcase },
];

const systemItems = [
  { title: "Responsible AI", url: "/responsible-ai", icon: Shield },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => (u === "/" ? pathname === "/" : pathname.startsWith(u));
  const getRoles = useServerFn(getMyRoles);
  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    retry: false,
    staleTime: 60_000,
  });
  const isAdmin = roles?.isAdmin ?? false;


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <BrandLogo size={36} className="shrink-0" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sidebar-foreground">Sebenza AI</span>
            <span className="text-xs text-muted-foreground">Automate. Organize. Succeed.</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {featureItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                    <Link to="/admin/users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
