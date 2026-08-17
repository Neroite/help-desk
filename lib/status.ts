import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Minus,
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
  // Fundo sólido com texto BRANCO por cima (badge preenchido, cabeçalho
  // de coluna do Kanban) — não usa colorVarFg: esse é escolhido pra ler
  // bem como TEXTO sobre a superfície do app (no dark, fica claro), o que
  // o torna ilegível como fundo com texto branco. colorVarSolid é fixo
  // entre os temas de propósito. Ver app/globals.css.
  colorVarSolid: string
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  aguardando_aprovacao: {
    rotuloPadrao: "Aguardando aprovação",
    icon: Clock,
    colorVar: "status-aguardando",
    colorVarFg: "status-aguardando-fg",
    colorVarSolid: "status-aguardando-solid",
  },
  a_fazer: {
    rotuloPadrao: "A fazer",
    icon: Circle,
    colorVar: "status-a-fazer",
    colorVarFg: "status-a-fazer-fg",
    colorVarSolid: "status-a-fazer-solid",
  },
  em_andamento: {
    rotuloPadrao: "Em andamento",
    icon: Play,
    colorVar: "status-andamento",
    colorVarFg: "status-andamento-fg",
    colorVarSolid: "status-andamento-solid",
  },
  pausado: {
    rotuloPadrao: "Pausado",
    icon: Pause,
    colorVar: "status-pausado",
    colorVarFg: "status-pausado-fg",
    colorVarSolid: "status-pausado-solid",
  },
  finalizado: {
    rotuloPadrao: "Finalizado",
    icon: CheckCircle2,
    colorVar: "status-finalizado",
    colorVarFg: "status-finalizado-fg",
    colorVarSolid: "status-finalizado-solid",
  },
  cancelado: {
    rotuloPadrao: "Cancelado",
    icon: XCircle,
    colorVar: "status-cancelado",
    colorVarFg: "status-cancelado-fg",
    colorVarSolid: "status-cancelado-solid",
  },
}

interface PrioridadeMeta {
  rotulo: string
  peso: number
  icon: LucideIcon
  // Mesma ideia de STATUS_META.colorVarSolid — fundo cheio, texto branco,
  // fixo entre os temas. Reaproveita os tokens "-solid" de status já
  // existentes em vez de criar cores novas (o registro visual — laranja =
  // atenção, vermelho = urgente — já é familiar de quem olha o Kanban);
  // "média" não tem status equivalente, ganha um token próprio.
  colorVarSolid: string
}

export const PRIORIDADE_META: Record<Prioridade, PrioridadeMeta> = {
  baixa: {
    rotulo: "Baixa",
    peso: 1,
    icon: ArrowDown,
    colorVarSolid: "status-cancelado-solid",
  },
  media: {
    rotulo: "Média",
    peso: 2,
    icon: Minus,
    colorVarSolid: "prioridade-media-solid",
  },
  alta: {
    rotulo: "Alta",
    peso: 3,
    icon: ArrowUp,
    colorVarSolid: "status-aguardando-solid",
  },
  critica: {
    rotulo: "Crítica",
    peso: 4,
    icon: Flame,
    colorVarSolid: "status-a-fazer-solid",
  },
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
