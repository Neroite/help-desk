"use client"

import { CheckCircle2, Headset, Settings2, UserRound } from "lucide-react"
import { motion } from "motion/react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"
import { PARA_QUEM, PARA_QUEM_EYEBROW } from "@/lib/site/conteudo"

const ICONES = [Headset, Settings2, UserRound] as const

export function ParaQuem() {
  const semAnimacao = useReducedMotionSafe()

  return (
    <section id="para-quem" className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-eyebrow text-center font-semibold tracking-wide text-primary uppercase">
        {PARA_QUEM_EYEBROW}
      </p>
      <h2 className="mt-2 text-d2 text-center text-foreground">Para cada papel, uma visão diferente</h2>

      <Tabs defaultValue={PARA_QUEM[0].titulo} className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
        <TabsList
          variant="line"
          className="h-auto w-full flex-row gap-2 overflow-x-auto pb-1 lg:w-auto lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
        >
          {PARA_QUEM.map((persona, i) => {
            const Icon = ICONES[i]
            return (
              <TabsTrigger
                key={persona.titulo}
                value={persona.titulo}
                className="h-auto flex-none justify-start gap-2.5 rounded-xl px-3 py-2.5 text-left lg:w-full"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium">{persona.titulo}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {PARA_QUEM.map((persona, i) => {
          const Icon = ICONES[i]
          return (
            <TabsContent key={persona.titulo} value={persona.titulo} className="outline-none">
              <PainelPersona persona={persona} Icon={Icon} semAnimacao={semAnimacao} />
            </TabsContent>
          )
        })}
      </Tabs>
    </section>
  )
}

function PainelPersona({
  persona,
  Icon,
  semAnimacao,
}: {
  persona: (typeof PARA_QUEM)[number]
  Icon: typeof Headset
  semAnimacao: boolean
}) {
  const conteudo = (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-d3 text-foreground">{persona.titulo}</h3>
          <p className="text-lead text-muted-foreground">{persona.descricao}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {persona.beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground/90">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )

  if (semAnimacao) return conteudo

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {conteudo}
    </motion.div>
  )
}
