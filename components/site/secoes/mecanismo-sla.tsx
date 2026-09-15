import { FloatingPaths } from "@/components/site/background-paths"
import { Reveal } from "@/components/site/reveal"
import { ShieldClock } from "@/components/site/shield-clock"
import { MECANISMO_SLA } from "@/lib/site/conteudo"

// Era o Hero (topo da página); o pedido do usuário foi abrir com o sistema
// de chamados em vez do mecanismo de SLA, então esse bloco desceu pra logo
// acima de Pilares — mas o ShieldClock e as FloatingPaths atrás dele
// continuam intactos, só reposicionados (nunca remover essa animação).
export function MecanismoSla() {
  return (
    <section className="relative overflow-hidden py-16">
      {/* Decorativo, daí o aria-hidden no wrapper e não no componente. O
          fundo é DESTA seção, não da landing inteira — ver histórico em
          components/site/secoes/hero.tsx antes da mudança: fixo na
          viewport, o efeito virava textura de página em vez de momento
          próprio da seção. */}
      <div aria-hidden="true" className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <Reveal className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-eyebrow font-medium text-muted-foreground">
            {MECANISMO_SLA.eyebrow}
          </span>
          <h2 className="text-d2 text-foreground">{MECANISMO_SLA.titulo}</h2>
          <p className="text-lead max-w-lg text-muted-foreground">{MECANISMO_SLA.subtitulo}</p>
        </div>

        <div className="flex min-w-0 items-center justify-center lg:justify-end">
          <ShieldClock />
        </div>
      </Reveal>
    </section>
  )
}
