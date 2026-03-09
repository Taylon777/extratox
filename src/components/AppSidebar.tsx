import {
  LayoutDashboard,
  Upload,
  FileDown,
  FileStack,
  LogOut,
  Sun,
  Moon,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Importar Extrato", url: "/importacao", icon: Upload },
  { title: "Extratos", url: "/extratos", icon: FileStack },
  { title: "Relatório PDF", url: "/relatorio", icon: FileDown },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight truncate">
                RR Finance
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-widest">
                Gestão Financeira
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border mx-3 w-auto" />

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-semibold px-3 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <Separator className="bg-sidebar-border mx-1 w-auto mb-3" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={theme === "dark" ? "Tema Claro" : "Tema Escuro"}>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-[18px] w-[18px] flex-shrink-0" />
                ) : (
                  <Moon className="h-[18px] w-[18px] flex-shrink-0" />
                )}
                {!collapsed && (
                  <span className="text-[13px]">
                    {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
                  </span>
                )}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair">
              <button
                onClick={signOut}
                className="flex items-center gap-3 w-full text-sidebar-foreground/50 hover:text-destructive transition-colors"
              >
                <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-[13px]">Sair</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
