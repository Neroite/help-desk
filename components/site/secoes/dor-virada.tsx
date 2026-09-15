import { DorViradaPares } from "@/components/site/secoes/dor-virada-pares"
import { DOR_VIRADA } from "@/lib/site/conteudo"

export function DorVirada() {
  return (
    <section id="dor-virada" className="bg-muted py-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-eyebrow text-center font-semibold tracking-wide text-primary uppercase">
          {DOR_VIRADA.eyebrow}
        </p>
        <h2 className="mt-2 text-d2 text-center text-foreground">{DOR_VIRADA.titulo}</h2>

        <DorViradaPares pares={DOR_VIRADA.pares} />

        <p className="mt-8 text-center text-lead text-foreground">{DOR_VIRADA.virada}</p>
      </div>
    </section>
  )
}
