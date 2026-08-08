"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Bell,
  Building2,
  LayoutDashboard,
  ListChecks,
  Moon,
  Search,
  Sun,
  Tags,
  Ticket,
  Timer,
  Users,
} from "lucide-react"

import { NovoChamadoProvider, useNovoChamado } from "@/components/chamado/novo-chamado-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  useSidebar,
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

const allNavItems = [...navItems, ...settingsItems]

// Escolhe o item de navegação ativo pela URL mais específica que casa com o
// pathname atual (evita que "/chamados" fique marcado ativo em "/chamados/meus").
function getActiveUrl(pathname: string) {
  const matches = allNavItems.filter(
    (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
  )
  if (matches.length === 0) return null
  return matches.reduce((longest, item) =>
    item.url.length > longest.url.length ? item : longest
  ).url
}

const activeMenuButtonStyle: CSSProperties = {
  backgroundColor: "var(--sidebar-active)",
  borderLeftColor: "var(--sidebar-active)",
  color: "#fff",
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Alternar tema"
      className="cursor-pointer rounded-full"
      disabled={!mounted}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {mounted && theme === "dark" ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  )
}

// Precisa ser um componente à parte (não inline no JSX de AppLayout):
// useNovoChamado() só enxerga o contexto de um componente renderizado como
// descendente de <NovoChamadoProvider> — e é o próprio AppLayout quem
// instancia o provider, então ele mesmo não pode consumir esse contexto.
function NovoTicketButton() {
  const { abrir } = useNovoChamado()
  return (
    <Button type="button" size="sm" className="cursor-pointer rounded-full px-3" onClick={abrir}>
      + Ticket
    </Button>
  )
}

// Rail escuro de 56px, expande pra 240px ao passar o mouse — precisa de
// useSidebar() pra saber se está em mobile (lá o comportamento é Sheet via
// tap, não hover) e pra empurrar o open/close do SidebarProvider do pai.
// Fica num componente à parte porque useSidebar() só funciona dentro de
// <SidebarProvider>.
function AppSidebar({ activeUrl }: { activeUrl: string | null }) {
  const { isMobile, setOpen } = useSidebar()
  const closeTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  function abrirNoHover() {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = undefined
    }
    setOpen(true)
  }

  // Atraso curto no fechar evita flicker ao cruzar rápido a borda do rail
  // (o cursor "sai" e "entra" de novo em poucos ms ao mirar num item).
  function fecharComAtraso() {
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), 120)
  }

  // Hover não alcança teclado: foco dentro do rail expande, e só recolhe
  // quando o foco realmente sai do container (relatedTarget fora dele) —
  // senão Tab de um item pro outro fecharia a sidebar no meio da navegação.
  function handleBlurCapture(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  const hoverHandlers = isMobile
    ? {}
    : {
        onMouseEnter: abrirNoHover,
        onMouseLeave: fecharComAtraso,
        onFocusCapture: abrirNoHover,
        onBlurCapture: handleBlurCapture,
      }

  return (
    <Sidebar collapsible="icon" {...hoverHandlers}>
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--sidebar-active)] text-sm font-bold text-white"
          >
            HD
          </div>
          <span className="truncate text-base font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Help-Desk
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.url === activeUrl
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="border-l-2 border-l-transparent"
                      style={isActive ? activeMenuButtonStyle : undefined}
                    >
                      <item.icon aria-hidden="true" className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = item.url === activeUrl
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="border-l-2 border-l-transparent"
                      style={isActive ? activeMenuButtonStyle : undefined}
                    >
                      <item.icon aria-hidden="true" className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState("")
  const activeUrl = getActiveUrl(pathname)

  function handleBuscaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const termo = busca.trim().replace(/^#/, "")
    if (/^\d+$/.test(termo)) {
      router.push(`/chamados/${termo}`)
      setBusca("")
    }
  }

  return (
    <NovoChamadoProvider>
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        style={
          {
            "--sidebar-width": "240px",
            "--sidebar-width-icon": "56px",
          } as CSSProperties
        }
      >
        <AppSidebar activeUrl={activeUrl} />

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer" />

            <form
              onSubmit={handleBuscaSubmit}
              role="search"
              className="relative w-full max-w-md"
            >
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por número do chamado (#482)..."
                aria-label="Buscar chamado por número"
                className="pl-8"
              />
            </form>

            <div className="ml-auto flex items-center gap-2">
              <NovoTicketButton />

              <ThemeToggle />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Notificações"
                className="relative cursor-pointer rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <Bell aria-hidden="true" />
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Menu do usuário"
                  className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Avatar>
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="cursor-pointer">
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/logout" />}
                    className="cursor-pointer"
                    variant="destructive"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-(--space-4)">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </NovoChamadoProvider>
  )
}
