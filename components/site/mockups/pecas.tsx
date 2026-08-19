// Clones estáticos da gramática visual de components/chamado/*-badge.tsx,
// SEM importar os componentes reais: StatusBadge/SlaBadge/PrioridadeBadge
// dependem de ReferenceDataProvider e useSlaClock (client-only, tick de
// 30s) — importados aqui, produziriam hydration mismatch (servidor não
// tem clock, cliente calcularia um tempo divergente). Strings literais,
// zero Date.now().

import { AlertTriangle, CheckCircle2, Clock, Pause, Play } from "lucide-react"

const STATUS_COR: Record<string, string> = {
  "a-fazer": "var(--status-a-fazer)",
  andamento: "var(--status-andamento)",
  pausado: "var(--status-pausado)",
  finalizado: "var(--status-finalizado)",
}

const STATUS_ICON: Record<string, typeof Clock> = {
  "a-fazer": Clock,
  andamento: Play,
  pausado: Pause,
  finalizado: CheckCircle2,
}

export function MockStatus({ status, rotulo }: { status: keyof typeof STATUS_COR; rotulo: string }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-foreground">
      <Icon className="size-3.5" style={{ color: STATUS_COR[status] }} />
      {rotulo}
    </span>
  )
}

export function MockPrioridade({ rotulo, cor }: { rotulo: string; cor: string }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-white"
      style={{ backgroundColor: cor }}
    >
      {rotulo}
    </span>
  )
}

export function MockSemPrioridade() {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-dashed border-accent/60 px-2 text-xs font-medium text-accent">
      <AlertTriangle className="size-3.5" />
      Sem prioridade
    </span>
  )
}

export function MockSla({ rotulo, tempo, cor }: { rotulo: string; tempo: string; cor: string }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium"
      style={{
        color: cor,
        borderWidth: 1,
        borderColor: `color-mix(in srgb, ${cor} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 12%, transparent)`,
      }}
    >
      <Clock className="size-3.5" />
      {rotulo} {tempo}
    </span>
  )
}

export function MockAvatar({ iniciais }: { iniciais: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
      {iniciais}
    </span>
  )
}
