import { CheckCircle2 } from "lucide-react"

import { PARA_QUEM } from "@/lib/site/conteudo"

export function ParaQuem() {
  return (
    <section id="para-quem" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-d2 text-center text-foreground">Para cada papel, uma visão diferente</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PARA_QUEM.map((persona) => (
          <div key={persona.titulo} className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
            <div>
              <h3 className="text-d3 text-foreground">{persona.titulo}</h3>
              <p className="text-sm text-muted-foreground">{persona.descricao}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {persona.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
