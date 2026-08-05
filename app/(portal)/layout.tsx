import type { ReactNode } from "react"
import Link from "next/link"

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-(--topbar-h) shrink-0 items-center justify-between border-b border-border bg-surface px-(--space-4)">
        <span className="text-base font-semibold text-foreground">
          Help-Desk
        </span>
        <nav className="flex items-center gap-(--space-4) text-sm">
          <Link
            href="/portal"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            Meus chamados
          </Link>
          <Link
            href="/portal/novo"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            Abrir chamado
          </Link>
          <Link
            href="/logout"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            Sair
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-(--space-4)">{children}</main>
    </div>
  )
}
