import { minutosUteisEntre } from "@/lib/sla/calendario"
import type { SlaSeveridade, StatusKey } from "@/lib/types"
import { STATUS_FINAIS } from "@/lib/types"

// Campos do ticket usados pra exibição de SLA — subconjunto de Ticket,
// aceito estruturalmente por qualquer chamador que já tenha o ticket
// inteiro em mãos (ver components/chamado/sla-progress.tsx e sla-badge.tsx).
export interface TicketSlaInfo {
  criadoEm: string
  statusKey: StatusKey
  slaPausadoEm: string | null
  slaMinutosPausados: number
  primeiraRespostaEm: string | null
  finalizadoEm: string | null
  slaRespostaVenceEm: string | null
  slaSolucaoVenceEm: string | null
}

export type SlaTipo = "resposta" | "solucao"

export interface SlaProgresso {
  percentual: number
  severidade: SlaSeveridade
  // Instante que o texto de contagem (formatarTempoRestante) deve usar no
  // lugar de "agora" — igual a `agora` enquanto o SLA está ativo, mas
  // congela no momento da pausa ou do encerramento, senão o badge mostra
  // uma contagem regressiva "ao vivo" para um prazo que já parou de contar.
  agoraEfetivo: Date
}

function venceEmDoTipo(ticket: TicketSlaInfo, tipo: SlaTipo): string | null {
  return tipo === "resposta" ? ticket.slaRespostaVenceEm : ticket.slaSolucaoVenceEm
}

// Resposta encerra em primeira_resposta_em; solução encerra em
// finalizado_em. Um ticket finalizado sem nunca ter tido resposta pública
// (ex.: cancelado direto) também congela a barra de resposta — não há mais
// nada que vá acontecer com ela.
function encerradoEmDoTipo(ticket: TicketSlaInfo, tipo: SlaTipo): string | null {
  if (tipo === "solucao") return ticket.finalizadoEm
  if (ticket.primeiraRespostaEm) return ticket.primeiraRespostaEm
  return STATUS_FINAIS.includes(ticket.statusKey) ? ticket.finalizadoEm : null
}

// Progresso e severidade de UM dos dois prazos (resposta OU solução) de um
// ticket, em minutos úteis — não é o motor de SLA de verdade (esse mora em
// lib/sla/, com testes densos); aqui é só "quanto da barra pintar".
//
// slaMinutosPausados é um único contador compartilhado pelos dois prazos
// (o motor empurra slaRespostaVenceEm E slaSolucaoVenceEm juntos a cada
// retomada — ver lib/sla/prazos.ts#aplicarRetomada). Isso significa que,
// se uma pausa acontecer DEPOIS da primeira resposta mas ANTES da
// finalização, o cálculo do prazo de resposta (já encerrado) desconta uma
// pausa que não é dele. Mesma simplificação do motor — não é escopo deste
// change resolver (exigiria separar o contador em dois campos no banco).
export function calcularProgressoSla(ticket: TicketSlaInfo, tipo: SlaTipo, agora: Date): SlaProgresso {
  const venceEm = venceEmDoTipo(ticket, tipo)
  if (!venceEm) return { percentual: 0, severidade: "ok", agoraEfetivo: agora }

  const encerradoEm = encerradoEmDoTipo(ticket, tipo)
  // slaPausadoEm, não status_key: a pausa pode ser manual (independente do
  // status geral do chamado) -- derivar do status faria a barra continuar
  // "correndo" visualmente enquanto o banco já registra o SLA pausado.
  const pausado = !encerradoEm && ticket.slaPausadoEm !== null

  // Congela no instante do encerramento; senão no instante da pausa; senão
  // segue o relógio.
  const momentoReferencia = encerradoEm
    ? new Date(encerradoEm)
    : pausado && ticket.slaPausadoEm
      ? new Date(ticket.slaPausadoEm)
      : agora

  const inicio = new Date(ticket.criadoEm)
  const fim = new Date(venceEm)
  // `venceEm` já vem empurrado pelos minutos pausados (aplicarRetomada
  // soma os dois juntos) — então minutosUteisEntre(inicio, fim) conta
  // relógio corrido, não minutos "úteis" de verdade. Descontar
  // slaMinutosPausados dos dois lados (total e decorrido) devolve o
  // orçamento e o consumo na mesma base: só tempo em que o chamado esteve
  // de fato ativo.
  const minutosTotais = minutosUteisEntre(inicio, fim) - ticket.slaMinutosPausados
  const minutosDecorridos = minutosUteisEntre(inicio, momentoReferencia) - ticket.slaMinutosPausados
  const percentualBase = minutosTotais > 0 ? (minutosDecorridos / minutosTotais) * 100 : 100
  const percentual = Math.min(100, Math.max(0, percentualBase))

  const estourado = !encerradoEm && !pausado && agora.getTime() >= fim.getTime()

  const severidade: SlaSeveridade = pausado
    ? "pausado"
    : estourado
      ? "estourado"
      : percentual >= 90
        ? "critico"
        : percentual >= 75
          ? "atencao"
          : "ok"

  return { percentual: estourado ? 100 : percentual, severidade, agoraEfetivo: momentoReferencia }
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
