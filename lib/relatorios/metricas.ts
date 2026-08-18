// Métricas agregadas para a fase 8 (dashboard/relatórios). Módulo puro --
// sem banco, sem "use client" -- na mesma linha de lib/sla/ e
// lib/tickets/duracao.ts: o cálculo é testável isolado, quem busca os
// tickets é a Server Component da página.
import { minutosUteisEntre } from "@/lib/sla/calendario"
import { STATUS_FINAIS, type Ticket } from "@/lib/types"

/** Minutos úteis entre abertura e primeira resposta pública. `null` se ainda não respondido. */
export function tempoRespostaMinutos(ticket: Ticket): number | null {
  if (!ticket.primeiraRespostaEm) return null
  return minutosUteisEntre(new Date(ticket.criadoEm), new Date(ticket.primeiraRespostaEm))
}

/** Minutos úteis entre abertura e finalização. `null` se ainda não finalizado. */
export function tempoSolucaoMinutos(ticket: Ticket): number | null {
  if (!ticket.finalizadoEm) return null
  return minutosUteisEntre(new Date(ticket.criadoEm), new Date(ticket.finalizadoEm))
}

/**
 * `true`/`false` se o chamado finalizado cumpriu o prazo de solução,
 * `null` se ainda está aberto ou foi cancelado -- cancelado sai da
 * estatística de SLA (spec motor-sla, "Encerramento das medições").
 */
export function chamadoCumpriuSla(ticket: Ticket): boolean | null {
  if (ticket.statusKey === "cancelado") return null
  if (!ticket.finalizadoEm || !ticket.slaSolucaoVenceEm) return null
  return new Date(ticket.finalizadoEm).getTime() <= new Date(ticket.slaSolucaoVenceEm).getTime()
}

export interface MetricaAgrupada {
  chave: string
  rotulo: string
  total: number
  abertos: number
  finalizados: number
  tempoRespostaMedioMin: number | null
  tempoSolucaoMedioMin: number | null
  cumprimentoSlaPercentual: number | null
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null
  return valores.reduce((soma, v) => soma + v, 0) / valores.length
}

function numeros(valores: (number | null)[]): number[] {
  return valores.filter((v): v is number => v !== null)
}

export function agruparMetricas(
  tickets: Ticket[],
  chaveDe: (ticket: Ticket) => string | null,
  rotuloDe: (chave: string) => string
): MetricaAgrupada[] {
  const grupos = new Map<string, Ticket[]>()
  for (const ticket of tickets) {
    const chave = chaveDe(ticket)
    if (chave === null) continue
    const grupo = grupos.get(chave)
    if (grupo) grupo.push(ticket)
    else grupos.set(chave, [ticket])
  }

  return Array.from(grupos.entries())
    .map(([chave, ts]) => {
      const veredito = numeros(ts.map(chamadoCumpriuSla).map((v) => (v === null ? null : v ? 1 : 0)))
      return {
        chave,
        rotulo: rotuloDe(chave),
        total: ts.length,
        abertos: ts.filter((t) => !STATUS_FINAIS.includes(t.statusKey)).length,
        finalizados: ts.filter((t) => t.statusKey === "finalizado").length,
        tempoRespostaMedioMin: media(numeros(ts.map(tempoRespostaMinutos))),
        tempoSolucaoMedioMin: media(numeros(ts.map(tempoSolucaoMinutos))),
        cumprimentoSlaPercentual:
          veredito.length > 0 ? (veredito.reduce((s, v) => s + v, 0) / veredito.length) * 100 : null,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export function metricasPorAnalista(
  tickets: Ticket[],
  usuarios: { id: string; nome: string }[]
): MetricaAgrupada[] {
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]))
  return agruparMetricas(
    tickets,
    (t) => t.analistaId,
    (id) => nomePorId.get(id) ?? "Desconhecido"
  )
}

export function metricasPorEmpresa(
  tickets: Ticket[],
  empresas: { id: string; nome: string }[]
): MetricaAgrupada[] {
  const nomePorId = new Map(empresas.map((e) => [e.id, e.nome]))
  return agruparMetricas(
    tickets,
    (t) => t.empresaId,
    (id) => nomePorId.get(id) ?? "Desconhecida"
  )
}
