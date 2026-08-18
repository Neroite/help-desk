"use client"

import { calcularProgressoSla, formatarTempoRestante, type SlaTipo, type TicketSlaInfo } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { SLA_SEVERIDADE_META } from "@/lib/status"
import { cn } from "@/lib/utils"

interface SlaBadgeProps {
  rotulo: string
  ticket: TicketSlaInfo
  tipo: SlaTipo
  className?: string
}

// Consome o SlaClockProvider (tick de 30s) em vez de ter seu próprio
// setInterval — com dezenas de chamados na tela, cada badge com o
// próprio timer de 1s vira jank garantido.
export function SlaBadge({ rotulo, ticket, tipo, className }: SlaBadgeProps) {
  const agora = useSlaClock()
  const venceEm = tipo === "resposta" ? ticket.slaRespostaVenceEm : ticket.slaSolucaoVenceEm

  // `agora` só existe depois de montar no cliente (ver lib/sla-clock.tsx —
  // evita divergir do HTML renderizado no servidor). Até lá, um placeholder
  // neutro do mesmo tamanho, sem calcular severidade/tempo.
  if (!agora) {
    return (
      <span
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground font-tabular",
          className
        )}
      >
        {rotulo} …
      </span>
    )
  }

  const { severidade, agoraEfetivo } = calcularProgressoSla(ticket, tipo, agora)
  const meta = SLA_SEVERIDADE_META[severidade]
  const Icon = meta.icon
  const tempo = formatarTempoRestante(venceEm, agoraEfetivo)
  const estourado = severidade === "estourado"

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium font-tabular",
        estourado ? "text-white" : "border",
        className
      )}
      style={
        estourado
          ? { backgroundColor: `var(--${meta.colorVar})` }
          : {
              color: `var(--${meta.colorVar})`,
              borderColor: `color-mix(in srgb, var(--${meta.colorVar}) 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, var(--${meta.colorVar}) 12%, transparent)`,
            }
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {rotulo} {tempo}
    </span>
  )
}
