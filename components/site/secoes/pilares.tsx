import { Building2, PauseCircle, Radio } from "lucide-react"

import { MockKanban } from "@/components/site/mockups/mock-kanban"
import { PILARES } from "@/lib/site/conteudo"

const ICONES = [PauseCircle, Radio, Building2] as const

export function Pilares() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-6 rounded-2xl border border-border bg-muted/60 p-8 sm:grid-cols-3">
        {PILARES.map((pilar, i) => {
          const Icon = ICONES[i]
          return (
            <div key={pilar.titulo} className="flex flex-col gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-d3 text-foreground">{pilar.titulo}</h3>
              <p className="text-sm text-muted-foreground">{pilar.descricao}</p>
            </div>
          )
        })}
      </div>

      {/* Prova visual do segundo pilar ("tempo real") — o Kanban saiu do
          hero (substituído pelo ShieldClock) e ganhou lugar de apoio aqui. */}
      <div className="mx-auto mt-8 min-w-0 max-w-2xl">
        <MockKanban />
      </div>
    </section>
  )
}
