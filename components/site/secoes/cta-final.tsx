import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CTA_FINAL, HERO } from "@/lib/site/conteudo"

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden py-20 text-white">
      {/* Foto real (não mockup) — única exceção da página, pedido explícito
          do usuário. Wash de --site-navy por cima (mesma regra de contraste
          de qualquer bloco full-bleed com texto branco: Fixed-Navy Rule),
          forte o bastante pra manter o texto legível sobre uma foto com
          luminância irregular (telas acesas, luz de teto). */}
      <Image
        src="/cta-equipe-suporte.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--site-navy) 82%, transparent)" }}
      />
      <div className="relative mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-d2">{CTA_FINAL.titulo}</h2>
        <p className="mt-4 text-lead" style={{ color: "var(--site-navy-fg)" }}>
          {CTA_FINAL.subtitulo}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            render={<Link href="/login" />}
            nativeButton={false}
            className="h-11 bg-white px-5 text-lead text-[var(--site-navy)] hover:bg-white/90"
          >
            {HERO.ctaPrimario}
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href="#faq" />}
            nativeButton={false}
            className="h-11 border-white/40 bg-transparent px-5 text-lead text-white hover:bg-white/10"
          >
            Ver perguntas frequentes
          </Button>
        </div>
      </div>
    </section>
  )
}
