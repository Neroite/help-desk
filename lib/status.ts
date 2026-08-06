import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  PauseCircle,
  Play,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import type { Prioridade, SlaSeveridade, StatusKey } from "@/lib/types"

interface StatusMeta {
  rotuloPadrao: string
  icon: LucideIcon
  colorVar: string
  // Variante pensada para texto pequeno (StatusBadge) — no light o
  // vibrante de colorVar sozinho não bate 4.5:1; no dark os dois
  // coincidem. Ver app/globals.css.
  colorVarFg: string
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  aguardando_aprovacao: {
    rotuloPadrao: "Aguardando aprovação",
    icon: Clock,
    colorVar: "status-aguardando",
    colorVarFg: "status-aguardando-fg",
  },
  a_fazer: {
    rotuloPadrao: "A fazer",
    icon: Circle,
    colorVar: "status-a-fazer",
    colorVarFg: "status-a-fazer-fg",
  },
  em_andamento: {
    rotuloPadrao: "Em andamento",
    icon: Play,
    colorVar: "status-andamento",
    colorVarFg: "status-andamento-fg",
  },
  pausado: {
    rotuloPadrao: "Pausado",
    icon: Pause,
    colorVar: "status-pausado",
    colorVarFg: "status-pausado-fg",
  },
  finalizado: {
    rotuloPadrao: "Finalizado",
    icon: CheckCircle2,
    colorVar: "status-finalizado",
    colorVarFg: "status-finalizado-fg",
  },
  cancelado: {
    rotuloPadrao: "Cancelado",
    icon: XCircle,
    colorVar: "status-cancelado",
    colorVarFg: "status-cancelado-fg",
  },
}

// Barra lateral + fundo tintado por status — dá ao card/linha uma cor
// perceptível sem depender só dos badges pequenos. Classes literais (não
// geradas por template) porque o Tailwind precisa achá-las no source para
// gerar o CSS; um `bg-${colorVar}/8` dinâmico não seria detectado.
// Separados (borda / fundo) porque a linha de tabela aplica cada parte num
// elemento diferente (a borda esquerda só renderiza de forma confiável na
// <td>, não na <tr>, no modelo de bordas do HTML table); o card usa os dois
// juntos no mesmo elemento.
export const STATUS_TINT_BORDER: Record<StatusKey, string> = {
  aguardando_aprovacao: "border-l-status-aguardando",
  a_fazer: "border-l-status-a-fazer",
  em_andamento: "border-l-status-andamento",
  pausado: "border-l-status-pausado",
  finalizado: "border-l-status-finalizado",
  cancelado: "border-l-status-cancelado",
}

export const STATUS_TINT_BG: Record<StatusKey, string> = {
  aguardando_aprovacao: "bg-status-aguardando/8",
  // /6 em vez de /8: a_fazer costuma ser o status mais populoso da fila,
  // e 8% do vermelho vibrante deixa a tabela inteira rosada.
  a_fazer: "bg-status-a-fazer/6",
  em_andamento: "bg-status-andamento/8",
  pausado: "bg-status-pausado/8",
  finalizado: "bg-status-finalizado/8",
  cancelado: "bg-status-cancelado/8",
}

export const STATUS_CARD_TINT: Record<StatusKey, string> = Object.fromEntries(
  Object.entries(STATUS_TINT_BORDER).map(([key, borderClass]) => [
    key,
    `${borderClass} ${STATUS_TINT_BG[key as StatusKey]}`,
  ])
) as Record<StatusKey, string>

interface PrioridadeMeta {
  rotulo: string
  peso: number
}

export const PRIORIDADE_META: Record<Prioridade, PrioridadeMeta> = {
  baixa: { rotulo: "Baixa", peso: 1 },
  media: { rotulo: "Média", peso: 2 },
  alta: { rotulo: "Alta", peso: 3 },
  critica: { rotulo: "Crítica", peso: 4 },
}

interface SlaSeveridadeMeta {
  rotulo: string
  icon: LucideIcon
  colorVar: string
}

export const SLA_SEVERIDADE_META: Record<SlaSeveridade, SlaSeveridadeMeta> = {
  ok: { rotulo: "No prazo", icon: CheckCircle2, colorVar: "sla-ok" },
  atencao: { rotulo: "Atenção", icon: Clock, colorVar: "sla-atencao" },
  critico: { rotulo: "Crítico", icon: AlertTriangle, colorVar: "sla-critico" },
  estourado: { rotulo: "Estourado", icon: AlertOctagon, colorVar: "sla-estourado" },
  pausado: { rotulo: "Pausado", icon: PauseCircle, colorVar: "sla-pausado" },
}
