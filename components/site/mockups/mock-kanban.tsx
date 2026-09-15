"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { Radio } from "lucide-react"

import { BrowserChrome } from "@/components/site/browser-chrome"
import { MockAvatar, MockPrioridade, MockSemPrioridade, MockSla } from "@/components/site/mockups/pecas"
import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

interface CardFicticio {
  numero: string
  titulo: string
  empresa: string
  prioridade?: { rotulo: string; cor: string }
  sla?: { rotulo: string; tempo: string; cor: string }
  avatar: string
}

type Coluna = { titulo: string; cards: CardFicticio[] }

const COLUNAS_INICIAIS: Coluna[] = [
  {
    titulo: "A fazer",
    cards: [
      { numero: "#1042", titulo: "Impressora não conecta na rede", empresa: "Contoso Ltda", avatar: "AN" },
      {
        numero: "#1041",
        titulo: "Acesso ao sistema financeiro",
        empresa: "Northwind",
        prioridade: { rotulo: "Alta", cor: "var(--status-aguardando-solid)" },
        avatar: "JS",
      },
    ],
  },
  {
    titulo: "Em andamento",
    cards: [
      {
        numero: "#1038",
        titulo: "Migração de e-mail corporativo",
        empresa: "Fabrikam",
        sla: { rotulo: "", tempo: "02h14", cor: "var(--sla-atencao)" },
        avatar: "MR",
      },
    ],
  },
  {
    titulo: "Pausado",
    cards: [
      {
        numero: "#1035",
        titulo: "Configuração de VPN para filial",
        empresa: "Contoso Ltda",
        sla: { rotulo: "", tempo: "Pausado", cor: "var(--sla-pausado)" },
        avatar: "AN",
      },
    ],
  },
]

// Card que ilustra o pilar "tempo real": alterna sozinho entre A fazer e Em
// andamento quando animado. É sem prioridade (o dado menos sensível a
// mexer) e nunca sai dessas duas colunas.
const CARD_MOVEL = "#1042"
const INTERVALO_MS = 5500

function moverCard(colunas: Coluna[]): Coluna[] {
  const origemIdx = colunas.findIndex((c) => c.cards.some((card) => card.numero === CARD_MOVEL))
  const destinoIdx = origemIdx === 0 ? 1 : 0
  const card = colunas[origemIdx].cards.find((c) => c.numero === CARD_MOVEL)
  if (!card) return colunas
  return colunas.map((coluna, i) => {
    if (i === origemIdx) return { ...coluna, cards: coluna.cards.filter((c) => c.numero !== CARD_MOVEL) }
    if (i === destinoIdx) return { ...coluna, cards: [card, ...coluna.cards] }
    return coluna
  })
}

interface MockKanbanProps {
  animado?: boolean
  // Número do card a realçar com anel em --primary. Opt-in: sem ela nada
  // muda (Pilares e ComoFunciona não passam a prop). Usado em
  // hero-montagem.tsx pra ligar o card #1041 da fila ao mesmo chamado
  // aberto no tablet — é o mesmo chamado em dois momentos, não dois dados
  // soltos lado a lado.
  destaque?: string
}

export function MockKanban({ animado = false, destaque }: MockKanbanProps) {
  // useReducedMotionSafe() começa sempre "true" no SSR e na primeira
  // renderização do cliente — por isso `colunas` também começa sempre no
  // array estático original, e a mutação só entra num efeito pós-montagem
  // (mesmo cuidado de components/site/shield-clock.tsx).
  const semAnimacao = useReducedMotionSafe()
  const [colunas, setColunas] = useState(COLUNAS_INICIAIS)
  const containerRef = useRef<HTMLDivElement>(null)
  const emVista = useInView(containerRef, { amount: 0.4 })
  const rodando = animado && !semAnimacao

  useEffect(() => {
    if (!rodando || !emVista) return
    const id = setInterval(() => setColunas((atual) => moverCard(atual)), INTERVALO_MS)
    return () => clearInterval(id)
  }, [rodando, emVista])

  return (
    <div ref={containerRef}>
      <BrowserChrome
        label={
          rodando
            ? "Prévia do Kanban de chamados: colunas A fazer, Em andamento e Pausado, com o card #1042 se movendo automaticamente entre A fazer e Em andamento, ilustrando a atualização em tempo real"
            : "Prévia do Kanban de chamados: colunas A fazer, Em andamento e Pausado, com prioridade e SLA visíveis em cada card"
        }
        url="aegis.app/chamados?view=kanban"
        extra={
          rodando ? (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Radio className="size-3 text-primary" aria-hidden="true" />
              ao vivo
            </span>
          ) : null
        }
      >
        <div className="flex gap-3 overflow-x-auto pb-1">
          {colunas.map((coluna) => (
            <div key={coluna.titulo} className="flex w-52 shrink-0 flex-col gap-2">
              <p className="px-1 text-xs font-semibold text-muted-foreground">{coluna.titulo}</p>
              {coluna.cards.map((card) => (
                <motion.div
                  key={card.numero}
                  layout={rodando}
                  transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                  className={`flex flex-col gap-2 rounded-md border border-border bg-surface p-(--card-pad) text-sm shadow-sm ${
                    card.numero === destaque ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-tabular text-xs text-muted-foreground">{card.numero}</span>
                    {card.prioridade ? (
                      <MockPrioridade rotulo={card.prioridade.rotulo} cor={card.prioridade.cor} />
                    ) : (
                      <MockSemPrioridade />
                    )}
                  </div>
                  <p className="line-clamp-2 font-medium text-foreground">{card.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{card.empresa}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <MockAvatar iniciais={card.avatar} />
                    {card.sla ? <MockSla rotulo={card.sla.rotulo} tempo={card.sla.tempo} cor={card.sla.cor} /> : <span />}
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </BrowserChrome>
    </div>
  )
}
