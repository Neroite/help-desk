import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HeroMontagem } from "@/components/site/secoes/hero-montagem"
import { TextReveal } from "@/components/site/text-reveal"
import { HERO } from "@/lib/site/conteudo"

// Abre a página com o sistema, não com o mecanismo de SLA — o Kanban (fila
// real) atrás e o chamado aberto (detalhe real) na frente dramatizam "o
// chamado inteiro em um só lugar" antes de qualquer frase explicar isso. O
// relógio de SLA (ShieldClock) é real e continua na página, só que como
// prova de um mecanismo específico mais abaixo (Mecanismo SLA), não como o
// resumo geral — ver components/site/secoes/mecanismo-sla.tsx.
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Wash só com --primary (nenhuma cor nova) atrás da seção inteira —
          radial mais forte atrás da montagem + um degradê linear que cresce
          rumo à base da seção. aria-hidden porque é puramente decorativo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 72% 22%, color-mix(in srgb, var(--primary) 26%, transparent) 0%, transparent 70%), linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--primary) 12%, transparent) 100%)",
        }}
      />
      {/* Único bloco da landing sem o max-w-6xl do resto das seções — de
          propósito: é o "resumo geral" da página, e cobrir a largura real
          da tela (em vez de ficar preso na mesma coluna centralizada de
          sempre) é o que faz esse momento se distinguir dos demais. O
          max-w-[1800px] é só uma rede de segurança pra monitor ultrawide,
          não um contêiner de conteúdo como os outros. */}
      <div className="relative mx-auto grid w-full max-w-[1800px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16 lg:py-24 xl:px-24">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-eyebrow font-medium text-muted-foreground">
            {HERO.eyebrow}
          </span>
          <TextReveal
            className="text-d1 text-foreground"
            textoAcessivel={HERO.titulo}
            segmentos={[
              { texto: HERO.titulo.split("em um só lugar.")[0] },
              { texto: "em um só lugar.", className: "text-primary" },
            ]}
          />
          <p className="text-lead max-w-lg text-muted-foreground">{HERO.subtitulo}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" render={<Link href="/login" />} nativeButton={false} className="h-11 px-5 text-lead">
              {HERO.ctaPrimario}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#como-funciona" />}
              nativeButton={false}
              className="h-11 px-5 text-lead"
            >
              {HERO.ctaSecundario}
            </Button>
          </div>
          <p className="-mt-3 text-sm text-muted-foreground">{HERO.ctaReasseguro}</p>
        </div>

        <HeroMontagem />
      </div>
    </section>
  )
}
