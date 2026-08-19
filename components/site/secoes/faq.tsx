"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ } from "@/lib/site/conteudo"

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="text-d2 text-center text-foreground">Perguntas frequentes</h2>
      <Accordion className="mt-10 gap-3" multiple={false}>
        {FAQ.map((item, i) => (
          <AccordionItem
            key={item.pergunta}
            value={String(i)}
            className="rounded-xl border border-border bg-surface px-4 sm:px-5"
          >
            <AccordionTrigger className="py-4 text-lead sm:py-5">{item.pergunta}</AccordionTrigger>
            <AccordionContent className="pb-4 text-sm text-muted-foreground sm:pb-5">
              {item.resposta}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
