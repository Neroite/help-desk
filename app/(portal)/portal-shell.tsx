"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Moon, Plus, Search, Sun } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useReferenceData } from "@/lib/reference-data/provider"

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
      className="cursor-pointer"
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

export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { usuarioAtual } = useReferenceData()
  const [busca, setBusca] = useState("")

  function handleBuscaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const termo = busca.trim().replace(/^#/, "")
    if (/^\d+$/.test(termo)) {
      router.push(`/portal/chamados/${termo}`)
      setBusca("")
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b border-border bg-surface px-(--space-4)">
        <Link
          href="/portal"
          className="shrink-0 text-base font-semibold text-foreground"
        >
          Help-Desk
        </Link>

        <nav className="hidden items-center gap-(--space-4) text-sm md:flex">
          <Link
            href="/portal"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            Meus chamados
          </Link>
        </nav>

        <form
          onSubmit={handleBuscaSubmit}
          role="search"
          className="relative ml-2 w-full max-w-xs"
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
          <Button
            render={<Link href="/portal/novo" />}
            nativeButton={false}
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="size-4" data-icon="inline-start" aria-hidden="true" />
            Abrir chamado
          </Button>

          <ThemeToggle />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notificações"
            className="relative cursor-pointer"
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
                <AvatarFallback>{usuarioAtual?.avatarIniciais ?? "?"}</AvatarFallback>
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
      <main className="flex-1 p-(--space-4)">{children}</main>
    </div>
  )
}
