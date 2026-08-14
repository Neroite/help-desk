"use client"

import { calcularSeveridade, formatarTempoRestante } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import type { StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SlaProgressProps {
  rotulo: string
  venceEm: string | null
  criadoEm: string
  statusKey: StatusKey
  // Painel lateral do detalhe mostra o rótulo ("Resposta"/"Solução") acima
  // da barra; na tabela isso já está no cabeçalho da coluna, então fica
  // implícito — repetir por linha seria redundante numa lista densa.
  mostrarRotulo?: boolean
  className?: string
}

// Barra fina de progresso de SLA, estilo Milvus: só a barra enchendo com o
// tempo decorrido — sem número de contagem regressiva poluindo a tela. O
// tempo exato continua acessível via `title` (tooltip nativo) e
// aria-label, pra quem precisa do valor sem exigir espaço visual permanente.
// Preenchimento usa o prazo real da política de SLA (criadoEm -> venceEm,
// motor de lib/sla/), nunca uma escala fixa — só a COR fica mais simples:
// uma cor enquanto dentro do prazo, vermelho sólido e barra cheia quando
// estoura (estado binário, não mais uma transição gradual).
export function SlaProgress({
  rotulo,
  venceEm,
  criadoEm,
  statusKey,
  mostrarRotulo = false,
  className,
}: SlaProgressProps) {
  const agora = useSlaClock()

  if (!agora) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {mostrarRotulo && <span className="text-xs text-muted-foreground">{rotulo}</span>}
        <div className="h-1.5 w-full rounded-full bg-muted" />
      </div>
    )
  }

  const severidade = calcularSeveridade(venceEm, statusKey, agora)
  const estourado = severidade === "estourado"
  const pausado = severidade === "pausado"

  let percentual = 0
  if (venceEm) {
    const inicio = new Date(criadoEm).getTime()
    const fim = new Date(venceEm).getTime()
    const total = fim - inicio
    const decorrido = agora.getTime() - inicio
    percentual = total > 0 ? Math.min(100, Math.max(0, (decorrido / total) * 100)) : 100
  }

  // Estourado é um estado binário pra exibição: sempre barra cheia e
  // vermelha, não importa há quanto tempo passou do prazo.
  const percentualExibido = estourado ? 100 : percentual
  const corVar = estourado ? "sla-estourado" : pausado ? "sla-pausado" : "primary"

  const tempo = formatarTempoRestante(venceEm, agora)
  const rotuloAcessivel = `SLA ${rotulo}: ${tempo}`

  return (
    <div className={cn("flex flex-col gap-1", className)} title={rotuloAcessivel}>
      {mostrarRotulo && <span className="text-xs text-muted-foreground">{rotulo}</span>}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={rotuloAcessivel}
        aria-valuenow={Math.round(percentualExibido)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percentualExibido}%`,
            backgroundColor: `var(--${corVar})`,
          }}
        />
      </div>
    </div>
  )
}
