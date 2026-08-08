import "server-only"

import { createClient } from "@/lib/supabase/server"
import type {
  Anexo,
  ApontamentoHoras,
  Avaliacao,
  CategoriaAtendimento,
  CategoriaProblema,
  Comentario,
  Empresa,
  Prioridade,
  SlaPolicy,
  StatusKey,
  Ticket,
  TicketEvento,
  Usuario,
} from "@/lib/types"

// Linha crua de helpdesk.ticket (colunas snake_case do Postgres).
interface TicketRow {
  numero: number
  titulo: string
  descricao: string
  empresa_id: string
  solicitante_id: string
  analista_id: string | null
  status_key: StatusKey
  prioridade: Prioridade | null
  cat_atendimento_id: string | null
  cat_problema_id: string | null
  criado_em: string
  primeira_resposta_em: string | null
  finalizado_em: string | null
  sla_resposta_vence_em: string | null
  sla_solucao_vence_em: string | null
  sla_pausado_em: string | null
  sla_minutos_pausados: number
}

function mapTicket(row: TicketRow): Ticket {
  return {
    numero: row.numero,
    titulo: row.titulo,
    descricao: row.descricao,
    empresaId: row.empresa_id,
    solicitanteId: row.solicitante_id,
    analistaId: row.analista_id,
    statusKey: row.status_key,
    prioridade: row.prioridade,
    catAtendimentoId: row.cat_atendimento_id,
    catProblemaId: row.cat_problema_id,
    criadoEm: row.criado_em,
    primeiraRespostaEm: row.primeira_resposta_em,
    finalizadoEm: row.finalizado_em,
    slaRespostaVenceEm: row.sla_resposta_vence_em,
    slaSolucaoVenceEm: row.sla_solucao_vence_em,
    slaPausadoEm: row.sla_pausado_em,
    slaMinutosPausados: row.sla_minutos_pausados,
  }
}

export interface FiltrosChamados {
  empresaId?: string
  statusKey?: StatusKey
  prioridade?: Prioridade
  // "eu" = usuário logado; "sem-atribuicao" = analista_id nulo; ou um id direto.
  analistaId?: string
  busca?: string
}

export async function listarChamados(filtros: FiltrosChamados = {}): Promise<Ticket[]> {
  const supabase = await createClient()
  let query = supabase.from("ticket").select("*").order("criado_em", { ascending: false })

  if (filtros.empresaId) query = query.eq("empresa_id", filtros.empresaId)
  if (filtros.statusKey) query = query.eq("status_key", filtros.statusKey)
  if (filtros.prioridade) query = query.eq("prioridade", filtros.prioridade)

  if (filtros.analistaId === "eu") {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) query = query.eq("analista_id", user.id)
  } else if (filtros.analistaId === "sem-atribuicao") {
    query = query.is("analista_id", null)
  } else if (filtros.analistaId) {
    query = query.eq("analista_id", filtros.analistaId)
  }

  if (filtros.busca) {
    const numeroBuscado = filtros.busca.trim().replace(/^#/, "")
    if (/^\d+$/.test(numeroBuscado)) {
      query = query.eq("numero", Number(numeroBuscado))
    } else {
      query = query.ilike("titulo", `%${filtros.busca.trim()}%`)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapTicket)
}

export async function buscarChamadoPorNumero(numero: number): Promise<Ticket | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket")
    .select("*")
    .eq("numero", numero)
    .maybeSingle()
  if (error) throw error
  return data ? mapTicket(data as TicketRow) : null
}

export async function listarComentarios(ticketNumero: number): Promise<Comentario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comentario")
    .select("id, ticket_id, autor_id, corpo, interno, criado_em")
    .eq("ticket_id", ticketNumero)
    .order("criado_em", { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    autorId: r.autor_id,
    corpo: r.corpo,
    interno: r.interno,
    criadoEm: r.criado_em,
  }))
}

export async function listarEventos(ticketNumero: number): Promise<TicketEvento[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ticket_evento")
    .select("id, ticket_id, tipo, de, para, autor_id, criado_em")
    .eq("ticket_id", ticketNumero)
    .order("criado_em", { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    tipo: r.tipo,
    de: r.de,
    para: r.para,
    autorId: r.autor_id,
    criadoEm: r.criado_em,
  }))
}

export async function listarApontamentos(ticketNumero: number): Promise<ApontamentoHoras[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("apontamento_horas")
    .select("id, ticket_id, analista_id, inicio, fim, minutos, descricao, faturavel")
    .eq("ticket_id", ticketNumero)
    .order("inicio", { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    analistaId: r.analista_id,
    inicio: r.inicio,
    fim: r.fim,
    minutos: r.minutos,
    descricao: r.descricao,
    faturavel: r.faturavel,
  }))
}

export async function listarAnexos(ticketNumero: number): Promise<Anexo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("anexo")
    .select("id, ticket_id, comentario_id, nome, tamanho, storage_path")
    .eq("ticket_id", ticketNumero)
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    comentarioId: r.comentario_id,
    nome: r.nome,
    tamanhoKb: Math.round(r.tamanho / 1024),
    tipo: /\.(png|jpe?g|gif|webp|svg)$/i.test(r.nome) ? "imagem" : "documento",
  }))
}

export async function buscarAvaliacao(ticketNumero: number): Promise<Avaliacao | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("avaliacao")
    .select("ticket_id, estrelas, comentario")
    .eq("ticket_id", ticketNumero)
    .maybeSingle()
  if (error) throw error
  return data ? { ticketId: data.ticket_id, estrelas: data.estrelas, comentario: data.comentario } : null
}

// --- Dado de referência (empresas, usuários, categorias, política de SLA) ---

export async function listarEmpresas(): Promise<Empresa[]> {
  const supabase = await createClient()
  const { data: empresas, error } = await supabase
    .from("empresa")
    .select("id, nome, cnpj, ativo")
    .order("nome")
  if (error) throw error

  const { data: statusRows, error: erroStatus } = await supabase
    .from("empresa_status")
    .select("empresa_id, status_key, ativo, rotulo")
  if (erroStatus) throw erroStatus

  return (empresas ?? []).map((e) => {
    const statusDaEmpresa = (statusRows ?? []).filter((s) => s.empresa_id === e.id)
    return {
      id: e.id,
      nome: e.nome,
      cnpj: e.cnpj,
      ativo: e.ativo,
      statusAtivos: statusDaEmpresa.filter((s) => s.ativo).map((s) => s.status_key as StatusKey),
      statusRotulos: Object.fromEntries(
        statusDaEmpresa.filter((s) => s.rotulo).map((s) => [s.status_key, s.rotulo])
      ),
    }
  })
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome, email, papel, empresa_id")
    .order("nome")
  if (error) throw error
  return (data ?? []).map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    empresaId: u.empresa_id,
    avatarIniciais: iniciais(u.nome),
  }))
}

export async function buscarUsuarioAtual(): Promise<Usuario | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome, email, papel, empresa_id")
    .eq("id", user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    papel: data.papel,
    empresaId: data.empresa_id,
    avatarIniciais: iniciais(data.nome),
  }
}

export async function listarCategoriasAtendimento(): Promise<CategoriaAtendimento[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categoria_atendimento").select("id, nome").order("nome")
  if (error) throw error
  return data ?? []
}

export async function listarCategoriasProblema(): Promise<CategoriaProblema[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categoria_problema")
    .select("id, nome, pai_id")
    .order("nome")
  if (error) throw error
  return (data ?? []).map((c) => ({ id: c.id, nome: c.nome, paiId: c.pai_id }))
}

export async function listarSlaPolicies(): Promise<SlaPolicy[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sla_policy")
    .select("prioridade, minutos_resposta, minutos_solucao")
  if (error) throw error
  return (data ?? []).map((p) => ({
    prioridade: p.prioridade,
    minutosResposta: p.minutos_resposta,
    minutosSolucao: p.minutos_solucao,
  }))
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ""
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""
  return (primeira + ultima).toUpperCase()
}
