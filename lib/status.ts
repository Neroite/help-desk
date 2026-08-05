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
}

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  aguardando_aprovacao: {
    rotuloPadrao: "Aguardando aprovação",
    icon: Clock,
    colorVar: "status-aguardando",
  },
  a_fazer: {
    rotuloPadrao: "A fazer",
    icon: Circle,
    colorVar: "status-a-fazer",
  },
  em_andamento: {
    rotuloPadrao: "Em andamento",
    icon: Play,
    colorVar: "status-andamento",
  },
  pausado: {
    rotuloPadrao: "Pausado",
    icon: Pause,
    colorVar: "status-pausado",
  },
  finalizado: {
    rotuloPadrao: "Finalizado",
    icon: CheckCircle2,
    colorVar: "status-finalizado",
  },
  cancelado: {
    rotuloPadrao: "Cancelado",
    icon: XCircle,
    colorVar: "status-cancelado",
  },
}

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
