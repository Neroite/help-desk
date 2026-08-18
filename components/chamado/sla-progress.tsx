"use client"

import { calcularProgressoSla, formatarTempoRestante, type SlaTipo, type TicketSlaInfo } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { SLA_SEVERIDADE_META } from "@/lib/status"
import { cn } from "@/lib/utils"

interface SlaProgressProps {
  rotulo: string
  ticket: TicketSlaInfo
  tipo: SlaTipo
  // Painel lateral do detalhe mostra o rótulo ("Resposta"/"Solução") acima
  // da barra; na tabela isso já está no cabeçalho da coluna, então fica
  // implícito — repetir por linha seria redundante numa lista densa.
  mostrarRotulo?: boolean
  className?: string
}

// Barra fina de progresso de SLA, estilo Milvus: enche em minutos úteis
// (calcularProgressoSla, lib/sla-display.ts), descontando pausa, e congela
// no instante do encerramento (primeira resposta / finalização) em vez de
// continuar contando pra sempre. Cor gradua de "ok" a "crítico" pelo
// percentual consumido, não por um corte fixo de minutos restantes.
export function SlaProgress({ rotulo, ticket, tipo, mostrarRotulo = false, className }: SlaProgressProps) {
  const agora = useSlaClock()
  const venceEm = tipo === "resposta" ? ticket.slaRespostaVenceEm : ticket.slaSolucaoVenceEm

  if (!agora) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {mostrarRotulo && <span className="text-xs text-muted-foreground">{rotulo}</span>}
        <div className="h-1.5 w-full rounded-full bg-muted" />
      </div>
    )
  }

  const { percentual, severidade, agoraEfetivo } = calcularProgressoSla(ticket, tipo, agora)
  const corVar = SLA_SEVERIDADE_META[severidade].colorVar

  const tempo = formatarTempoRestante(venceEm, agoraEfetivo)
  const rotuloAcessivel = `SLA ${rotulo}: ${tempo}`

  return (
    <div className={cn("flex flex-col gap-1", className)} title={rotuloAcessivel}>
      {mostrarRotulo && <span className="text-xs text-muted-foreground">{rotulo}</span>}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={rotuloAcessivel}
        aria-valuenow={Math.round(percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percentual}%`,
            backgroundColor: `var(--${corVar})`,
          }}
        />
      </div>
    </div>
  )
}
