import type { SlaSeveridade, StatusKey } from "@/lib/types"
import { STATUS_PAUSA_SLA } from "@/lib/types"

// Cálculo de severidade para exibição (SlaBadge). Não é o motor de SLA de
// verdade — esse mora em lib/sla/ (fase 1), com calendário de horário
// comercial e testes densos. Aqui é só "quanto falta, visualmente".
export function calcularSeveridade(
  venceEm: string | null,
  statusKey: StatusKey,
  agora: Date
): SlaSeveridade {
  if (STATUS_PAUSA_SLA.includes(statusKey)) return "pausado"
  if (!venceEm) return "ok"

  const restanteMs = new Date(venceEm).getTime() - agora.getTime()
  if (restanteMs <= 0) return "estourado"

  const restanteMin = restanteMs / 60_000
  if (restanteMin <= 15) return "critico"

  // Sem o prazo total à mão aqui (é derivado da política, não do ticket),
  // usamos um corte fixo de 60min como "atenção" — suficiente para o mock.
  if (restanteMin <= 60) return "atencao"

  return "ok"
}

export function formatarTempoRestante(venceEm: string | null, agora: Date): string {
  if (!venceEm) return "—"
  const diffMs = new Date(venceEm).getTime() - agora.getTime()
  const abs = Math.abs(diffMs)
  const horas = Math.floor(abs / 3_600_000)
  const minutos = Math.floor((abs % 3_600_000) / 60_000)
  const texto = horas > 0 ? `${horas}h${String(minutos).padStart(2, "0")}` : `${minutos}min`
  return diffMs < 0 ? `-${texto}` : texto
}
