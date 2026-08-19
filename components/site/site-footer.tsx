import Link from "next/link"

import { AegisLogo } from "@/components/site/aegis-logo"
import { NAV } from "@/lib/site/conteudo"

export function SiteFooter() {
  const ano = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <AegisLogo />
          <p className="text-sm text-muted-foreground">Aegis — help desk com SLA que sabe quando parar.</p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </a>
          ))}
          <Link href="/login" className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {ano} Aegis
      </div>
    </footer>
  )
}
