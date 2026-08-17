"use server"

import { revalidatePath } from "next/cache"

import { aplicarPausa, aplicarRetomada, calcularPrazos, recalcularPorPrioridade } from "@/lib/sla/prazos"
import { createClient } from "@/lib/supabase/server"
import { STATUS_PAUSA_SLA, type Papel, type Prioridade, type StatusKey } from "@/lib/types"

interface TicketSlaColunas {
  criado_em: string
  sla_resposta_vence_em: string
  sla_solucao_vence_em: string
  sla_pausado_em: string | null
  sla_minutos_pausados: number
  status_key: StatusKey
  analista_id?: string | null
}

export interface CriarChamadoInput {
  titulo: string
  descricao: string
  empresaId: string
  solicitanteId: string
  catProblemaId?: string | null
}

export async function criarChamado(input: CriarChamadoInput): Promise<{ numero: number }> {
  const supabase = await createClient()

  const { data: politicaPadrao, error: erroPolitica } = await supabase
    .from("sla_policy")
    .select("minutos_resposta, minutos_solucao")
    .is("prioridade", null)
    .single()
  if (erroPolitica) throw erroPolitica

  const agora = new Date()
  const prazos = calcularPrazos(agora, {
    minutosResposta: politicaPadrao.minutos_resposta,
    minutosSolucao: politicaPadrao.minutos_solucao,
  })

  const { data: ticket, error } = await supabase
    .from("ticket")
    .insert({
      titulo: input.titulo,
      descricao: input.descricao,
      empresa_id: input.empresaId,
      solicitante_id: input.solicitanteId,
      cat_problema_id: input.catProblemaId ?? null,
      sla_resposta_vence_em: prazos.respostaVenceEm.toISOString(),
      sla_solucao_vence_em: prazos.solucaoVenceEm.toISOString(),
    })
    .select("numero")
    .single()
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticket.numero,
    tipo: "criado",
    de: null,
    para: "a_fazer",
    autor_id: user?.id,
  })

  revalidatePath("/chamados")
  revalidatePath("/portal")
  return { numero: ticket.numero }
}

export interface AdicionarComentarioInput {
  ticketNumero: number
  corpo: string
  interno: boolean
}

export async function adicionarComentario(input: AdicionarComentarioInput): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("comentario").insert({
    ticket_id: input.ticketNumero,
    autor_id: user.id,
    corpo: input.corpo,
    interno: input.interno,
  })
  if (error) throw error

  // Comentário público muda quem "está com a bola" — usado pela coluna
  // derivada "Última interação do cliente" (lib/kanban/colunas.ts) e pelo
  // tile "Aguardando resposta" do dashboard. Grava junto com a checagem de
  // primeira resposta abaixo pra não abrir um round-trip a mais.
  if (!input.interno) {
    const { data: usuario } = await supabase
      .from("usuario")
      .select("papel")
      .eq("id", user.id)
      .single()
    const papel: Papel | undefined = usuario?.papel
    const ehStaff = papel === "admin" || papel === "analista"

    await supabase
      .from("ticket")
      .update({
        ultima_interacao_em: new Date().toISOString(),
        ultima_interacao_papel: papel ?? null,
      })
      .eq("numero", input.ticketNumero)

    // Primeira resposta pública encerra o SLA de resposta (spec: "responde
    // → primeira_resposta_em grava, SLA de resposta encerra").
    if (ehStaff) {
      const { data: ticket } = await supabase
        .from("ticket")
        .select("primeira_resposta_em")
        .eq("numero", input.ticketNumero)
        .single()
      if (ticket && !ticket.primeira_resposta_em) {
        await supabase
          .from("ticket")
          .update({ primeira_resposta_em: new Date().toISOString() })
          .eq("numero", input.ticketNumero)
      }
    }
  }

  revalidatePath(`/chamados/${input.ticketNumero}`)
  revalidatePath(`/portal/chamados/${input.ticketNumero}`)
}

export interface FazerTriageInput {
  ticketNumero: number
  prioridade: Prioridade
  catAtendimentoId: string
  analistaId: string
}

export async function fazerTriage(input: FazerTriageInput): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select("criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key, prioridade")
    .eq("numero", input.ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const { data: politica, error: erroPolitica } = await supabase
    .from("sla_policy")
    .select("minutos_resposta, minutos_solucao")
    .eq("prioridade", input.prioridade)
    .single()
  if (erroPolitica) throw erroPolitica

  const prazos = recalcularPorPrioridade(
    {
      criadoEm: new Date(ticket.criado_em),
      slaRespostaVenceEm: new Date(ticket.sla_resposta_vence_em),
      slaSolucaoVenceEm: new Date(ticket.sla_solucao_vence_em),
      slaPausadoEm: ticket.sla_pausado_em ? new Date(ticket.sla_pausado_em) : null,
      slaMinutosPausados: ticket.sla_minutos_pausados,
    },
    { minutosResposta: politica.minutos_resposta, minutosSolucao: politica.minutos_solucao }
  )

  const { error } = await supabase
    .from("ticket")
    .update({
      prioridade: input.prioridade,
      cat_atendimento_id: input.catAtendimentoId,
      analista_id: input.analistaId,
      sla_resposta_vence_em: prazos.respostaVenceEm.toISOString(),
      sla_solucao_vence_em: prazos.solucaoVenceEm.toISOString(),
    })
    .eq("numero", input.ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert([
    {
      ticket_id: input.ticketNumero,
      tipo: "prioridade",
      de: ticket.prioridade,
      para: input.prioridade,
      autor_id: user?.id,
    },
    {
      ticket_id: input.ticketNumero,
      tipo: "atribuicao",
      de: null,
      para: input.analistaId,
      autor_id: user?.id,
    },
  ])

  revalidatePath(`/chamados/${input.ticketNumero}`)
  revalidatePath("/chamados")
}

export async function atribuirAnalista(ticketNumero: number, analistaId: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("ticket")
    .update({ analista_id: analistaId })
    .eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "atribuicao",
    de: null,
    para: analistaId,
    autor_id: user?.id,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// Muda só a prioridade (sem tocar categoria/atribuição, diferente do
// triage completo) — recalcula o SLA do mesmo jeito, porque qualquer
// troca de prioridade muda a política aplicável.
export async function definirPrioridade(ticketNumero: number, prioridade: Prioridade): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, prioridade"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const { data: politica, error: erroPolitica } = await supabase
    .from("sla_policy")
    .select("minutos_resposta, minutos_solucao")
    .eq("prioridade", prioridade)
    .single()
  if (erroPolitica) throw erroPolitica

  const prazos = recalcularPorPrioridade(
    {
      criadoEm: new Date(ticket.criado_em),
      slaRespostaVenceEm: new Date(ticket.sla_resposta_vence_em),
      slaSolucaoVenceEm: new Date(ticket.sla_solucao_vence_em),
      slaPausadoEm: ticket.sla_pausado_em ? new Date(ticket.sla_pausado_em) : null,
      slaMinutosPausados: ticket.sla_minutos_pausados,
    },
    { minutosResposta: politica.minutos_resposta, minutosSolucao: politica.minutos_solucao }
  )

  const { error } = await supabase
    .from("ticket")
    .update({
      prioridade,
      sla_resposta_vence_em: prazos.respostaVenceEm.toISOString(),
      sla_solucao_vence_em: prazos.solucaoVenceEm.toISOString(),
    })
    .eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "prioridade",
    de: ticket.prioridade,
    para: prioridade,
    autor_id: user?.id,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

export async function mudarStatus(ticketNumero: number, novoStatus: StatusKey): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key, analista_id"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const estadoAtual: TicketSlaColunas = ticket

  // Sair de qualquer coluna exige técnico atribuído, exceto ir para
  // "cancelado" — cancelar um chamado que ninguém pegou ainda é legítimo.
  // Mesma regra de lib/kanban/colunas.ts#dropPermitido, aplicada aqui pra
  // valer também fora do drag-and-drop (menu do card, quick edit, bulk).
  if (novoStatus !== "cancelado" && estadoAtual.analista_id === null) {
    throw new Error("Chamado sem técnico atribuído — atribua um técnico antes de mudar o status.")
  }

  const estavaPausado = STATUS_PAUSA_SLA.includes(estadoAtual.status_key)
  const vaiPausar = STATUS_PAUSA_SLA.includes(novoStatus)

  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: estadoAtual.sla_pausado_em ? new Date(estadoAtual.sla_pausado_em) : null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }

  const agora = new Date()
  const proximoSla = !estavaPausado && vaiPausar
    ? aplicarPausa(slaState, agora)
    : estavaPausado && !vaiPausar
      ? aplicarRetomada(slaState, agora)
      : slaState

  const atualizacao: Record<string, unknown> = {
    status_key: novoStatus,
    sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
    sla_minutos_pausados: proximoSla.slaMinutosPausados,
    sla_resposta_vence_em: proximoSla.slaRespostaVenceEm.toISOString(),
    sla_solucao_vence_em: proximoSla.slaSolucaoVenceEm.toISOString(),
  }
  if (novoStatus === "finalizado") atualizacao.finalizado_em = agora.toISOString()

  const { error } = await supabase.from("ticket").update(atualizacao).eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "status",
    de: estadoAtual.status_key,
    para: novoStatus,
    autor_id: user?.id,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// Usada pelo diálogo "Atribuir técnico" do Kanban, quando um drop exige
// técnico (ver lib/kanban/colunas.ts#dropPermitido): atribui e move numa
// chamada só, em vez de duas idas ao servidor.
export async function atribuirEMover(
  ticketNumero: number,
  analistaId: string,
  novoStatus: StatusKey
): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const estadoAtual: TicketSlaColunas = ticket
  const estavaPausado = STATUS_PAUSA_SLA.includes(estadoAtual.status_key)
  const vaiPausar = STATUS_PAUSA_SLA.includes(novoStatus)

  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: estadoAtual.sla_pausado_em ? new Date(estadoAtual.sla_pausado_em) : null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }

  const agora = new Date()
  const proximoSla = !estavaPausado && vaiPausar
    ? aplicarPausa(slaState, agora)
    : estavaPausado && !vaiPausar
      ? aplicarRetomada(slaState, agora)
      : slaState

  const atualizacao: Record<string, unknown> = {
    analista_id: analistaId,
    status_key: novoStatus,
    sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
    sla_minutos_pausados: proximoSla.slaMinutosPausados,
    sla_resposta_vence_em: proximoSla.slaRespostaVenceEm.toISOString(),
    sla_solucao_vence_em: proximoSla.slaSolucaoVenceEm.toISOString(),
  }
  if (novoStatus === "finalizado") atualizacao.finalizado_em = agora.toISOString()

  const { error } = await supabase.from("ticket").update(atualizacao).eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert([
    { ticket_id: ticketNumero, tipo: "atribuicao", de: null, para: analistaId, autor_id: user?.id },
    { ticket_id: ticketNumero, tipo: "status", de: estadoAtual.status_key, para: novoStatus, autor_id: user?.id },
  ])

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// "Iniciar atendimento" — verbo próprio em vez de um mudarStatus genérico:
// atribui o analista atual quando o chamado ainda não tem um, e deixa um
// evento com texto na conversa (renderizado como card de mensagem, não
// como comentário — ver ticket-timeline.tsx).
export async function iniciarAtendimento(ticketNumero: number, analistaId?: string | null): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key, analista_id"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const estadoAtual: TicketSlaColunas = ticket

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const precisaAtribuir = estadoAtual.analista_id === null
  const analistaFinal = estadoAtual.analista_id ?? analistaId ?? user?.id ?? null
  if (!analistaFinal) throw new Error("Chamado sem técnico — informe quem vai atender antes de iniciar.")

  const estavaPausado = STATUS_PAUSA_SLA.includes(estadoAtual.status_key)
  const agora = new Date()
  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: estadoAtual.sla_pausado_em ? new Date(estadoAtual.sla_pausado_em) : null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }
  const proximoSla = estavaPausado ? aplicarRetomada(slaState, agora) : slaState

  const atualizacao: Record<string, unknown> = {
    status_key: "em_andamento",
    sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
    sla_minutos_pausados: proximoSla.slaMinutosPausados,
    sla_resposta_vence_em: proximoSla.slaRespostaVenceEm.toISOString(),
    sla_solucao_vence_em: proximoSla.slaSolucaoVenceEm.toISOString(),
  }
  if (precisaAtribuir) atualizacao.analista_id = analistaFinal

  const { error } = await supabase.from("ticket").update(atualizacao).eq("numero", ticketNumero)
  if (error) throw error

  if (precisaAtribuir) {
    await supabase.from("ticket_evento").insert({
      ticket_id: ticketNumero,
      tipo: "atribuicao",
      de: null,
      para: analistaFinal,
      autor_id: user?.id,
    })
  }

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "inicio",
    de: estadoAtual.status_key,
    para: "em_andamento",
    autor_id: user?.id,
    corpo: "Atendimento iniciado",
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// Pausar exige motivo — congela o prazo de SLA (aplicarPausa) e grava o
// motivo no próprio evento, em vez de um texto genérico "Status: X → Pausado".
export async function pausarChamado(ticketNumero: number, motivo: string): Promise<void> {
  const motivoLimpo = motivo.trim()
  if (!motivoLimpo) throw new Error("Informe o motivo da pausa.")

  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const estadoAtual: TicketSlaColunas = ticket
  const agora = new Date()
  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: estadoAtual.sla_pausado_em ? new Date(estadoAtual.sla_pausado_em) : null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }
  const proximoSla = aplicarPausa(slaState, agora)

  const { error } = await supabase
    .from("ticket")
    .update({
      status_key: "pausado",
      sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
      sla_minutos_pausados: proximoSla.slaMinutosPausados,
    })
    .eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "pausa",
    de: estadoAtual.status_key,
    para: "pausado",
    autor_id: user?.id,
    corpo: motivoLimpo,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// Retomar destrava o prazo de SLA (aplicarRetomada) — soma o tempo parado
// aos dois prazos, mesma lógica que mudarStatus já aplicava ao sair de um
// status de STATUS_PAUSA_SLA, só que com o evento "retomada" em vez de
// "status" genérico.
export async function retomarChamado(ticketNumero: number): Promise<void> {
  const supabase = await createClient()

  const { data: ticket, error: erroTicket } = await supabase
    .from("ticket")
    .select(
      "criado_em, sla_resposta_vence_em, sla_solucao_vence_em, sla_pausado_em, sla_minutos_pausados, status_key"
    )
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const estadoAtual: TicketSlaColunas = ticket
  const agora = new Date()
  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: estadoAtual.sla_pausado_em ? new Date(estadoAtual.sla_pausado_em) : null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }
  const proximoSla = aplicarRetomada(slaState, agora)

  const { error } = await supabase
    .from("ticket")
    .update({
      status_key: "em_andamento",
      sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
      sla_minutos_pausados: proximoSla.slaMinutosPausados,
      sla_resposta_vence_em: proximoSla.slaRespostaVenceEm.toISOString(),
      sla_solucao_vence_em: proximoSla.slaSolucaoVenceEm.toISOString(),
    })
    .eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "retomada",
    de: estadoAtual.status_key,
    para: "em_andamento",
    autor_id: user?.id,
    corpo: "Atendimento retomado",
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

export async function definirCategorias(
  ticketNumero: number,
  catAtendimentoId: string | null,
  catProblemaId: string | null
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("ticket")
    .update({ cat_atendimento_id: catAtendimentoId, cat_problema_id: catProblemaId })
    .eq("numero", ticketNumero)
  if (error) throw error

  const [{ data: atendimento }, { data: problema }] = await Promise.all([
    catAtendimentoId
      ? supabase.from("categoria_atendimento").select("nome").eq("id", catAtendimentoId).single()
      : Promise.resolve({ data: null as { nome: string } | null }),
    catProblemaId
      ? supabase.from("categoria_problema").select("nome").eq("id", catProblemaId).single()
      : Promise.resolve({ data: null as { nome: string } | null }),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "categoria",
    de: null,
    para: "categoria",
    autor_id: user?.id,
    corpo: `Categorias atualizadas — Atendimento: ${atendimento?.nome ?? "sem categoria"} · Problema: ${problema?.nome ?? "sem categoria"}`,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

export interface AvaliarInput {
  ticketNumero: number
  estrelas: 1 | 2 | 3 | 4 | 5
  comentario: string
}

export async function avaliar(input: AvaliarInput): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("avaliacao").insert({
    ticket_id: input.ticketNumero,
    estrelas: input.estrelas,
    comentario: input.comentario,
  })
  if (error) throw error

  revalidatePath(`/portal/chamados/${input.ticketNumero}`)
}
