"use server"

import { revalidatePath } from "next/cache"

import { construirHtmlComentario, documentoTemConteudo } from "@/lib/comentario/render-html"
import {
  aplicarPausa,
  aplicarRetomada,
  calcularPrazos,
  pausarSeNecessario,
  recalcularPorPrioridade,
} from "@/lib/sla/prazos"
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
  // Primeiro id vira ticket.solicitante_id (mesma pessoa "dona" do chamado);
  // os demais viram linhas de ticket_contato. Substitui o antigo campo único
  // `solicitanteId` -- referência Milvus pede multi-contato na abertura (F10).
  // Só o form do staff usa mais de um: ticket_contato é staff-only por RLS
  // (correção C6), o portal sempre manda um array de 1 (o próprio usuário).
  contatoIds: string[]
  catProblemaId?: string | null
  mesaId?: string | null
}

export async function criarChamado(input: CriarChamadoInput): Promise<{ numero: number }> {
  if (input.contatoIds.length === 0) {
    throw new Error("Informe ao menos um contato.")
  }
  const [solicitanteId, ...contatosExtras] = input.contatoIds

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
      solicitante_id: solicitanteId,
      cat_problema_id: input.catProblemaId ?? null,
      mesa_id: input.mesaId ?? null,
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

  // Um único insert em lote, não N chamadas a adicionarContato (C6) -- isso
  // seriam 4N round-trips e N revalidações pra uma ação que já é uma única
  // submissão de formulário.
  if (contatosExtras.length > 0) {
    await supabase.from("ticket_contato").insert(
      contatosExtras.map((usuarioId) => ({
        ticket_id: ticket.numero,
        usuario_id: usuarioId,
        adicionado_por: user?.id,
      }))
    )
  }

  // Descrição vira o primeiro comentário público do chamado, autorado pelo
  // solicitante -- senão o texto que ele escreveu ao abrir some para quem vai
  // atender (só aparecia no portal). Insert direto, NÃO via adicionarComentario:
  // aquela função grava primeira_resposta_em quando o autor é staff, e quem abre
  // em nome do cliente aqui é o staff -- chamá-la zeraria o SLA de resposta no
  // instante da criação. origem = 'descricao' (mesmo marcador da migration
  // retroativa) distingue este comentário de um digitado depois na timeline.
  if (input.descricao.trim() !== "") {
    await supabase.from("comentario").insert({
      ticket_id: ticket.numero,
      autor_id: solicitanteId,
      corpo: input.descricao,
      interno: false,
      criado_em: agora.toISOString(),
      origem: "descricao",
    })
  }

  revalidatePath("/chamados")
  revalidatePath("/portal")
  return { numero: ticket.numero }
}

export interface AdicionarComentarioInput {
  ticketNumero: number
  corpo: string
  interno: boolean
  // JSON do editor rich text (`editor.getJSON()`), quando o comentário veio
  // do modal com Tiptap (F5). O servidor constrói o HTML aqui -- nunca
  // aceita HTML pronto do cliente (correção C2). Ausente = comentário de
  // texto puro (composer do portal, ou fallback), grava `corpo` como veio.
  documentoRico?: unknown
  // Anexos "de verdade" (não imagem colada inline no corpo) subidos antes
  // do comentário existir -- o upload já aconteceu (o ticket já existe,
  // diferente da abertura de chamado), só falta ligar comentario_id depois
  // que o insert abaixo devolve o id novo.
  anexoIds?: string[]
}

export async function adicionarComentario(input: AdicionarComentarioInput): Promise<{ id: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const corpo = input.documentoRico ? construirHtmlComentario(input.documentoRico) : input.corpo
  const formato = input.documentoRico ? "html" : "texto"
  // documentoTemConteudo, não corpoTextoPlano === "" -- um comentário só
  // com imagem (sem nenhuma palavra) é válido e não pode ser barrado aqui.
  if (input.documentoRico && !documentoTemConteudo(input.documentoRico)) {
    throw new Error("Comentário vazio.")
  }

  const { data: comentario, error } = await supabase
    .from("comentario")
    .insert({
      ticket_id: input.ticketNumero,
      autor_id: user.id,
      corpo,
      formato,
      interno: input.interno,
    })
    .select("id")
    .single()
  if (error) throw error

  if (input.anexoIds && input.anexoIds.length > 0) {
    await supabase.from("anexo").update({ comentario_id: comentario.id }).in("id", input.anexoIds)
  }

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
  return { id: comentario.id }
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
  // Único ponto de guarda agora — o Kanban é só visualização (não muda mais
  // status), então isso vale pro menu rápido da lista e pras ações em lote.
  if (novoStatus !== "cancelado" && estadoAtual.analista_id === null) {
    throw new Error("Chamado sem técnico atribuído — atribua um técnico antes de mudar o status.")
  }

  // sla_pausado_em, não status_key: o SLA pode já estar pausado manualmente
  // (pausarSlaManualmente) mesmo com o chamado num status "ativo" -- derivar
  // do status faria essa mudança sobrescrever slaPausadoEm e roubar minutos
  // do cálculo de pausa (aplicarPausa não é idempotente).
  const estavaPausado = estadoAtual.sla_pausado_em !== null
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

  // sla_pausado_em, não status_key -- mesmo motivo de mudarStatus: iniciar
  // atendimento também destrava uma pausa manual de SLA ativa, mesmo que o
  // status já não estivesse em STATUS_PAUSA_SLA.
  const estavaPausado = estadoAtual.sla_pausado_em !== null
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
  // pausarSeNecessario, não aplicarPausa direto: se o SLA já estava
  // pausado (manualmente, via pausarSlaManualmente), não sobrescreve
  // slaPausadoEm -- aplicarPausa não é idempotente e resetaria o relógio,
  // roubando os minutos já contabilizados da pausa em curso.
  const proximoSla = pausarSeNecessario(slaState, agora)

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

// Pausa de SLA independente do status geral do chamado -- diferente de
// pausarChamado, que também muda status_key pra "pausado". Escondida na UI
// quando o status já está em STATUS_PAUSA_SLA (o SLA já está congelado por
// ali); a guarda abaixo replica isso no servidor contra corrida entre abas.
export async function pausarSlaManualmente(ticketNumero: number, motivo: string): Promise<void> {
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
  if (STATUS_PAUSA_SLA.includes(estadoAtual.status_key)) {
    throw new Error('O chamado já está pausado pelo status -- use "Retomar atendimento".')
  }
  if (estadoAtual.sla_pausado_em) return // já pausado manualmente, no-op

  const agora = new Date()
  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: null,
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }
  const proximoSla = pausarSeNecessario(slaState, agora)

  const { error } = await supabase
    .from("ticket")
    .update({
      sla_pausado_em: proximoSla.slaPausadoEm?.toISOString() ?? null,
      sla_minutos_pausados: proximoSla.slaMinutosPausados,
    })
    .eq("numero", ticketNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // de: null sinaliza "sem transição de status_key" pra quem auditar a
  // tabela de eventos -- diferente do evento "pausa" de pausarChamado, que
  // sempre tem de/para de status_key.
  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "pausa",
    de: null,
    para: estadoAtual.status_key,
    autor_id: user?.id,
    corpo: motivoLimpo,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

export async function retomarSlaManualmente(ticketNumero: number): Promise<void> {
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
  if (STATUS_PAUSA_SLA.includes(estadoAtual.status_key)) {
    throw new Error('O chamado está pausado pelo status -- use "Retomar atendimento".')
  }
  if (!estadoAtual.sla_pausado_em) return // já não pausado, no-op

  const agora = new Date()
  const slaState = {
    criadoEm: new Date(estadoAtual.criado_em),
    slaRespostaVenceEm: new Date(estadoAtual.sla_resposta_vence_em),
    slaSolucaoVenceEm: new Date(estadoAtual.sla_solucao_vence_em),
    slaPausadoEm: new Date(estadoAtual.sla_pausado_em),
    slaMinutosPausados: estadoAtual.sla_minutos_pausados,
  }
  const proximoSla = aplicarRetomada(slaState, agora)

  const { error } = await supabase
    .from("ticket")
    .update({
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
    de: null,
    para: estadoAtual.status_key,
    autor_id: user?.id,
    // Texto fixo diferente de "Atendimento retomado" (retomarChamado) --
    // não confundir na timeline: aqui só o SLA foi destravado, não o
    // atendimento em si.
    corpo: "SLA retomado",
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

export interface CriarTicketFilhoInput {
  paiNumero: number
  titulo: string
  descricao: string
  mesaId?: string | null
}

// Divide um chamado em ações menores por setor: o filho herda cliente e
// solicitante do pai (mesmo problema, outra frente de trabalho), mas nasce
// com prazo de SLA e política próprios — como qualquer chamado novo.
export async function criarTicketFilho(input: CriarTicketFilhoInput): Promise<{ numero: number }> {
  const supabase = await createClient()

  const { data: pai, error: erroPai } = await supabase
    .from("ticket")
    .select("empresa_id, solicitante_id")
    .eq("numero", input.paiNumero)
    .single()
  if (erroPai) throw erroPai

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

  const { data: filho, error } = await supabase
    .from("ticket")
    .insert({
      titulo: input.titulo,
      descricao: input.descricao,
      empresa_id: pai.empresa_id,
      solicitante_id: pai.solicitante_id,
      pai_id: input.paiNumero,
      mesa_id: input.mesaId ?? null,
      sla_resposta_vence_em: prazos.respostaVenceEm.toISOString(),
      sla_solucao_vence_em: prazos.solucaoVenceEm.toISOString(),
    })
    .select("numero")
    .single()
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert([
    { ticket_id: filho.numero, tipo: "criado", de: null, para: "a_fazer", autor_id: user?.id },
    {
      ticket_id: input.paiNumero,
      tipo: "filho",
      de: null,
      para: String(filho.numero),
      autor_id: user?.id,
    },
  ])

  revalidatePath(`/chamados/${input.paiNumero}`)
  revalidatePath("/chamados")
  return { numero: filho.numero }
}

// Unifica chamados duplicados: o duplicado é anexado ao principal (fica
// rastreável por conciliado_no_id) e finalizado, preservando comentários e
// anexos — nada é apagado. Funciona em qualquer status dos dois lados, por
// isso não passa por mudarStatus (que exige técnico atribuído antes de sair
// de "A fazer" — regra de atendimento normal, não de deduplicação).
export async function conciliarChamado(principalNumero: number, duplicadoNumero: number): Promise<void> {
  if (principalNumero === duplicadoNumero) {
    throw new Error("Um chamado não pode ser conciliado nele mesmo.")
  }

  const supabase = await createClient()
  const agora = new Date().toISOString()

  const { error } = await supabase
    .from("ticket")
    .update({ conciliado_no_id: principalNumero, status_key: "finalizado", finalizado_em: agora })
    .eq("numero", duplicadoNumero)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert([
    {
      ticket_id: duplicadoNumero,
      tipo: "conciliacao",
      de: null,
      para: String(principalNumero),
      autor_id: user?.id,
      corpo: `Conciliado como duplicado do chamado #${principalNumero}`,
    },
    {
      ticket_id: principalNumero,
      tipo: "conciliacao",
      de: null,
      para: String(duplicadoNumero),
      autor_id: user?.id,
      corpo: `Chamado #${duplicadoNumero} conciliado como duplicado deste`,
    },
  ])

  revalidatePath(`/chamados/${principalNumero}`)
  revalidatePath(`/chamados/${duplicadoNumero}`)
  revalidatePath("/chamados")
}

// Upsert de "última vez que este usuário viu o chamado" — chamado ao abrir
// o detalhe (staff), não é um log de todas as visualizações.
export async function registrarVisualizacao(ticketNumero: number): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("ticket_visualizacao")
    .upsert(
      { ticket_id: ticketNumero, usuario_id: user.id, visto_em: new Date().toISOString() },
      { onConflict: "ticket_id,usuario_id" }
    )
}

export async function adicionarContato(ticketNumero: number, usuarioId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("ticket_contato")
    .insert({ ticket_id: ticketNumero, usuario_id: usuarioId, adicionado_por: user?.id })
  if (error) throw error

  const { data: contato } = await supabase.from("usuario").select("nome").eq("id", usuarioId).single()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "contato",
    de: null,
    para: usuarioId,
    autor_id: user?.id,
    corpo: `${user?.id === usuarioId ? "Você" : (contato?.nome ?? "Alguém")} passou a acompanhar o chamado`,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
}

export async function removerContato(ticketNumero: number, usuarioId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("ticket_contato")
    .delete()
    .eq("ticket_id", ticketNumero)
    .eq("usuario_id", usuarioId)
  if (error) throw error

  revalidatePath(`/chamados/${ticketNumero}`)
}

export async function definirMesa(ticketNumero: number, mesaId: string | null): Promise<void> {
  const supabase = await createClient()

  const { data: ticketAtual, error: erroTicket } = await supabase
    .from("ticket")
    .select("mesa_id")
    .eq("numero", ticketNumero)
    .single()
  if (erroTicket) throw erroTicket

  const { error } = await supabase.from("ticket").update({ mesa_id: mesaId }).eq("numero", ticketNumero)
  if (error) throw error

  const [{ data: mesaAnterior }, { data: mesaNova }] = await Promise.all([
    ticketAtual.mesa_id
      ? supabase.from("mesa_trabalho").select("nome").eq("id", ticketAtual.mesa_id).single()
      : Promise.resolve({ data: null as { nome: string } | null }),
    mesaId
      ? supabase.from("mesa_trabalho").select("nome").eq("id", mesaId).single()
      : Promise.resolve({ data: null as { nome: string } | null }),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from("ticket_evento").insert({
    ticket_id: ticketNumero,
    tipo: "mesa",
    de: mesaAnterior?.nome ?? null,
    para: mesaNova?.nome ?? "Sem mesa",
    autor_id: user?.id,
  })

  revalidatePath(`/chamados/${ticketNumero}`)
  revalidatePath("/chamados")
}

// Sem evento de timeline (ao contrário de definirMesa): `evento_tipo` não
// tem valor "setor" no enum, e adicionar um exigiria migration própria
// (Postgres não permite usar valor de enum recém-criado na mesma
// transação) -- fora do escopo pedido para este campo.
export async function definirSetor(ticketNumero: number, setorId: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("ticket").update({ setor_id: setorId }).eq("numero", ticketNumero)
  if (error) throw error

  revalidatePath(`/chamados/${ticketNumero}`)
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
