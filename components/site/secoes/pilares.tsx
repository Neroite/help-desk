import { Building2, PauseCircle, Radio } from "lucide-react"

import { MockKanban } from "@/components/site/mockups/mock-kanban"
import { Reveal } from "@/components/site/reveal"
import { PILARES, PILARES_EYEBROW, PILARES_TITULO } from "@/lib/site/conteudo"

const ICONES = [PauseCircle, Radio, Building2] as const

export function Pilares() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-eyebrow text-center font-semibold tracking-wide text-primary uppercase">
          {PILARES_EYEBROW}
        </p>
        <h2 className="mt-2 text-d2 text-center text-foreground">{PILARES_TITULO}</h2>
      </div>

      <Reveal>
        {/* Full-bleed, mesma regra de contraste dos outros blocos --site-navy
            (Fixed-Navy Rule, ver site.css) — cor fixa nos dois temas em vez
            de --primary, que clareia no dark e perderia contraste com texto
            branco. */}
        <div className="mt-10 py-16 text-white" style={{ backgroundColor: "var(--site-navy)" }}>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3">
            {PILARES.map((pilar, i) => {
              const Icon = ICONES[i]
              return (
                <div key={pilar.titulo} className="flex flex-col gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-d3">{pilar.titulo}</h3>
                  <p className="text-sm text-white/70">{pilar.descricao}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* O mockup fica ancorado sob o pilar do meio ("tempo real") em vez
            de centralizado sob os três — o conector e o card que se move
            sozinho no Kanban dramatizam esse pilar especificamente. */}
        <div className="mx-auto mt-8 grid max-w-6xl gap-2 px-4 sm:grid-cols-3">
          <div aria-hidden="true" className="hidden h-8 w-px justify-self-center bg-border sm:col-start-2 sm:block" />
          <div className="min-w-0 sm:col-span-2 sm:col-start-2">
            <MockKanban animado />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
