import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import {
  Building2,
  LayoutDashboard,
  ListChecks,
  Search,
  Tags,
  Ticket,
  Timer,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Navegação mockada — Admin e Analista. Sem checagem de papel real ainda.
const navItems = [
  { title: "Chamados", url: "/chamados", icon: Ticket },
  { title: "Meus chamados", url: "/chamados/meus", icon: ListChecks },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
]

// Grupo "Configurações" — visível sempre por enquanto (papel Admin ainda não é checado).
const settingsItems = [
  { title: "Empresas", url: "/configuracoes/empresas", icon: Building2 },
  { title: "Usuários", url: "/configuracoes/usuarios", icon: Users },
  { title: "Categorias", url: "/configuracoes/categorias", icon: Tags },
  { title: "SLA", url: "/configuracoes/sla", icon: Timer },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "240px" } as CSSProperties}
    >
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-2">
          <span className="text-base font-semibold text-sidebar-foreground">
            Help-Desk
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton render={<Link href={item.url} />}>
                      <item.icon data-icon="inline-start" />
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton render={<Link href={item.url} />}>
                      <item.icon data-icon="inline-start" />
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar chamados..."
              className="pl-8"
            />
          </div>
          <Avatar className="ml-auto size-8">
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 p-(--space-4)">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
