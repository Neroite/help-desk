import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FloatingPaths } from "@/components/site/background-paths"
import { ShieldClock } from "@/components/site/shield-clock"
import { TextReveal } from "@/components/site/text-reveal"
import { HERO } from "@/lib/site/conteudo"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorativo, daí o aria-hidden no wrapper e não no componente.
          O fundo é DESTA seção, e não da landing inteira: uma versão
          anterior o deixou fixo na viewport, atrás de tudo, e o efeito
          virou textura de página em vez de momento do Hero. */}
      <div aria-hidden="true" className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-16 size-80 rounded-full bg-primary/10 blur-3xl"
      />
      {/* Único bloco da landing sem o max-w-6xl do resto das seções — de
          propósito: é o "resumo geral" da página, e cobrir a largura real
          da tela (em vez de ficar preso na mesma coluna centralizada de
          sempre) é o que faz esse momento se distinguir dos demais. O
          max-w-[1800px] é só uma rede de segurança pra monitor ultrawide,
          não um contêiner de conteúdo como os outros.
          z-10: o blur acima é absolute com z-index:auto — por ordem de
          empilhamento do CSS, isso pinta acima de conteúdo estático mesmo
          vindo antes no DOM, então o conteúdo real precisa de z-index
          explícito para ficar por cima. */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1800px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16 lg:py-24 xl:px-24">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-eyebrow font-medium text-muted-foreground">
            {HERO.eyebrow}
          </span>
          <TextReveal
            className="text-d1 text-foreground"
            textoAcessivel={HERO.titulo}
            segmentos={[
              { texto: HERO.titulo.split("sabe quando parar.")[0] },
              { texto: "sabe quando parar.", className: "text-primary" },
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
        </div>

        <div className="flex min-w-0 items-center justify-center lg:justify-end">
          <ShieldClock />
        </div>
      </div>
    </section>
  )
}
