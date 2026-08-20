"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Moon, Plus, Search, Sun } from "lucide-react"

import { AegisLogo } from "@/components/brand/aegis-logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  const { theme, setTheme } = useTheme()
  const [busca, setBusca] = useState("")
  const [buscaSheetAberto, setBuscaSheetAberto] = useState(false)

  function handleBuscaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const termo = busca.trim().replace(/^#/, "")
    if (termo) {
      router.push(`/portal?busca=${encodeURIComponent(termo)}`)
      setBusca("")
      setBuscaSheetAberto(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b border-border bg-surface px-(--space-4)">
        <Link
          href="/portal"
          className="flex shrink-0 items-center gap-2 text-base font-semibold text-foreground"
        >
          <div
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <AegisLogo className="size-4" />
          </div>
          Aegis
        </Link>

        {/* Só um link (mesmo destino do logo) -- `hidden md:flex` deixava o
            portal sem NENHUMA navegação abaixo de 768px (F11). Como é um só
            item redundante com o logo, a correção é mostrá-lo sempre, não
            construir um Sheet de navegação pra um link só. */}
        <nav className="flex items-center gap-(--space-4) text-sm">
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
          className="relative ml-2 hidden min-w-0 flex-1 sm:block sm:max-w-xs"
        >
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por número ou título do chamado..."
            aria-label="Buscar chamado por número ou título"
            className="pl-8"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Buscar chamado"
            className="cursor-pointer sm:hidden"
            onClick={() => setBuscaSheetAberto(true)}
          >
            <Search aria-hidden="true" />
          </Button>

          <Button
            render={<Link href="/portal/novo" />}
            nativeButton={false}
            size="sm"
            aria-label="Abrir chamado"
            className="cursor-pointer"
          >
            <Plus className="size-4" data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Abrir chamado</span>
          </Button>

          <div className="hidden items-center gap-2 sm:flex">
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
          </div>

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
              <div className="sm:hidden">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  Alternar tema
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Notificações (3)</DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
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

      <Sheet open={buscaSheetAberto} onOpenChange={setBuscaSheetAberto}>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Buscar chamado</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleBuscaSubmit} role="search" className="relative px-4 pb-4">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-6.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por número ou título do chamado..."
              aria-label="Buscar chamado por número ou título"
              className="pl-8"
            />
          </form>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-(--space-4)">{children}</main>
    </div>
  )
}
