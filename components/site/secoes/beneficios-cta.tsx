import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HERO, RECAP } from "@/lib/site/conteudo"

export function BeneficiosCta() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-d2 text-foreground">{RECAP.titulo}</h2>
      <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-3 text-left">
        {RECAP.itens.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-lead text-foreground/90">
            <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" render={<Link href="/login" />} nativeButton={false} className="h-11 px-5 text-lead">
          {HERO.ctaPrimario}
        </Button>
        <Button
          size="lg"
          variant="outline"
          render={<a href="#faq" />}
          nativeButton={false}
          className="h-11 px-5 text-lead"
        >
          Ver perguntas frequentes
        </Button>
      </div>
    </section>
  )
}
