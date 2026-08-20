import { adicionarMinutosUteis, minutosUteisEntre } from "./calendario"

interface PoliticaSla {
  minutosResposta: number
  minutosSolucao: number
}

// Estado de SLA do ticket em Date, isolado do formato de persistencia
// (ISO string em lib/types.Ticket) — o motor nao acessa banco.
export interface TicketSlaState {
  criadoEm: Date
  slaRespostaVenceEm: Date
  slaSolucaoVenceEm: Date
  slaPausadoEm: Date | null
  slaMinutosPausados: number
}

interface Prazos {
  respostaVenceEm: Date
  solucaoVenceEm: Date
}

export function calcularPrazos(criadoEm: Date, politica: PoliticaSla): Prazos {
  return {
    respostaVenceEm: adicionarMinutosUteis(criadoEm, politica.minutosResposta),
    solucaoVenceEm: adicionarMinutosUteis(criadoEm, politica.minutosSolucao),
  }
}

export function aplicarPausa(ticket: TicketSlaState, agora: Date): TicketSlaState {
  return { ...ticket, slaPausadoEm: agora }
}

// aplicarPausa NÃO é idempotente -- chamar de novo sobre um ticket já
// pausado sobrescreve slaPausadoEm e "rouba" os minutos já decorridos da
// pausa em curso. Como o SLA pode ser pausado tanto pelo status
// (pausado/aguardando_aprovacao) quanto manualmente e independente do
// status (helpdesk.ticket.sla_pausado_em é o único campo, os dois tipos de
// pausa nunca coexistem), toda pausa precisa passar por aqui em vez de
// chamar aplicarPausa direto.
export function pausarSeNecessario(ticket: TicketSlaState, agora: Date): TicketSlaState {
  return ticket.slaPausadoEm ? ticket : aplicarPausa(ticket, agora)
}

export function aplicarRetomada(ticket: TicketSlaState, agora: Date): TicketSlaState {
  if (!ticket.slaPausadoEm) return ticket

  // Arredondado: slaMinutosPausados persiste em coluna `int` no banco, e
  // minutosUteisEntre devolve fração de minuto (ms / 60_000).
  const minutosParados = Math.round(minutosUteisEntre(ticket.slaPausadoEm, agora))

  return {
    ...ticket,
    slaPausadoEm: null,
    slaMinutosPausados: ticket.slaMinutosPausados + minutosParados,
    slaRespostaVenceEm: adicionarMinutosUteis(ticket.slaRespostaVenceEm, minutosParados),
    slaSolucaoVenceEm: adicionarMinutosUteis(ticket.slaSolucaoVenceEm, minutosParados),
  }
}

export function recalcularPorPrioridade(ticket: TicketSlaState, novaPolitica: PoliticaSla): Prazos {
  const base = calcularPrazos(ticket.criadoEm, novaPolitica)

  if (ticket.slaMinutosPausados === 0) return base

  return {
    respostaVenceEm: adicionarMinutosUteis(base.respostaVenceEm, ticket.slaMinutosPausados),
    solucaoVenceEm: adicionarMinutosUteis(base.solucaoVenceEm, ticket.slaMinutosPausados),
  }
}
