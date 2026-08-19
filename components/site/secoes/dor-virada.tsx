import { ArrowRight, X } from "lucide-react"

import { DOR_VIRADA } from "@/lib/site/conteudo"

export function DorVirada() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-d2 text-center text-foreground">{DOR_VIRADA.titulo}</h2>

        <div className="mt-10 flex flex-col gap-3">
          {DOR_VIRADA.pares.map((par) => (
            <div
              key={par.antes}
              className="flex flex-col items-stretch gap-2 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-start gap-2 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                {par.antes}
              </div>
              <ArrowRight
                className="hidden size-4 shrink-0 text-muted-foreground sm:block"
                aria-hidden="true"
              />
              <div className="flex flex-1 items-start gap-2 text-sm font-medium text-foreground">
                <span
                  className="mt-0.5 inline-block size-4 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--sla-ok)" }}
                  aria-hidden="true"
                />
                {par.depois}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-lead text-foreground">{DOR_VIRADA.virada}</p>
      </div>
    </section>
  )
}
