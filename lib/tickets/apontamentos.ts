"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { minutosEntre } from "@/lib/tickets/duracao"
import type { ApontamentoHoras } from "@/lib/types"

// RLS (`apontamento_horas_staff_all`) já restringe a tabela inteira a
// admin/analista — solicitante nunca vê horas. As checagens aqui são de
// coerência do fluxo (timer duplicado, apontamento alheio), não de acesso.

async function usuarioAtualId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Sessão expirada — entre novamente para apontar horas.")
  return user.id
}

function mapear(r: {
  id: string
  ticket_id: number
  analista_id: string
  inicio: string
  fim: string | null
  minutos: number | null
  descricao: string | null
  faturavel: boolean
}): ApontamentoHoras {
  return {
    id: r.id,
    ticketId: r.ticket_id,
    analistaId: r.analista_id,
    inicio: r.inicio,
    fim: r.fim,
    minutos: r.minutos,
    descricao: r.descricao,
    faturavel: r.faturavel,
  }
}

/**
 * Timer aberto do usuário atual, em qualquer chamado — `null` se não há.
 * O detalhe do chamado usa isso para saber se mostra "Iniciar" ou "Parar",
 * e para avisar quando o timer que está rodando é de outro chamado.
 */
export async function buscarTimerAberto(): Promise<ApontamentoHoras | null> {
  const supabase = await createClient()
  const analistaId = await usuarioAtualId()

  const { data, error } = await supabase
    .from("apontamento_horas")
    .select("id, ticket_id, analista_id, inicio, fim, minutos, descricao, faturavel")
    .eq("analista_id", analistaId)
    .is("fim", null)
    .maybeSingle()
  if (error) throw error

  return data ? mapear(data) : null
}

export async function iniciarTimer(ticketNumero: number): Promise<void> {
  const supabase = await createClient()
  const analistaId = await usuarioAtualId()

  // Checagem amigável antes de tentar gravar: o índice parcial
  // `apontamento_horas_timer_aberto_unico_idx` é quem realmente garante a
  // unicidade, mas o erro cru do Postgres não diz onde o timer está aberto.
  const aberto = await buscarTimerAberto()
  if (aberto) {
    throw new Error(
      aberto.ticketId === ticketNumero
        ? "Já existe um timer rodando neste chamado."
        : `Já existe um timer rodando no chamado #${aberto.ticketId}. Pare-o antes de iniciar outro.`
    )
  }

  const { error } = await supabase.from("apontamento_horas").insert({
    ticket_id: ticketNumero,
    analista_id: analistaId,
    inicio: new Date().toISOString(),
  })
  if (error) throw error

  revalidatePath(`/chamados/${ticketNumero}`)
}

export async function pararTimer(
  apontamentoId: string,
  descricao?: string | null
): Promise<void> {
  const supabase = await createClient()
  const analistaId = await usuarioAtualId()

  const { data: apontamento, error: erroBusca } = await supabase
    .from("apontamento_horas")
    .select("id, ticket_id, analista_id, inicio, fim")
    .eq("id", apontamentoId)
    .single()
  if (erroBusca) throw erroBusca
  if (apontamento.analista_id !== analistaId) {
    throw new Error("Este timer é de outro analista.")
  }
  if (apontamento.fim !== null) {
    throw new Error("Este apontamento já foi encerrado.")
  }

  const fim = new Date()
  const minutos = minutosEntre(new Date(apontamento.inicio), fim)

  const { error } = await supabase
    .from("apontamento_horas")
    .update({
      fim: fim.toISOString(),
      minutos,
      descricao: descricao?.trim() || null,
    })
    .eq("id", apontamentoId)
  if (error) throw error

  revalidatePath(`/chamados/${apontamento.ticket_id}`)
}

export interface RegistrarManualInput {
  ticketNumero: number
  minutos: number
  descricao: string
  faturavel: boolean
}

/**
 * Lançamento retroativo, para o trabalho feito longe do sistema (visita,
 * chamada telefônica). Grava `inicio`/`fim` coerentes com a duração informada
 * terminando agora, para que a linha do tempo continue fazendo sentido.
 */
export async function registrarManual(input: RegistrarManualInput): Promise<void> {
  const supabase = await createClient()
  const analistaId = await usuarioAtualId()

  if (!Number.isInteger(input.minutos) || input.minutos <= 0) {
    throw new Error("Informe uma duração em minutos maior que zero.")
  }

  const fim = new Date()
  const inicio = new Date(fim.getTime() - input.minutos * 60000)

  const { error } = await supabase.from("apontamento_horas").insert({
    ticket_id: input.ticketNumero,
    analista_id: analistaId,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    minutos: input.minutos,
    descricao: input.descricao.trim() || null,
    faturavel: input.faturavel,
  })
  if (error) throw error

  revalidatePath(`/chamados/${input.ticketNumero}`)
}

export async function excluirApontamento(apontamentoId: string): Promise<void> {
  const supabase = await createClient()
  const analistaId = await usuarioAtualId()

  const { data: apontamento, error: erroBusca } = await supabase
    .from("apontamento_horas")
    .select("id, ticket_id, analista_id")
    .eq("id", apontamentoId)
    .single()
  if (erroBusca) throw erroBusca

  // Admin pode limpar lançamento errado de qualquer analista; analista só
  // mexe no próprio. `is_admin()` é a mesma função que a RLS usa.
  if (apontamento.analista_id !== analistaId) {
    const { data: ehAdmin, error: erroPapel } = await supabase.rpc("is_admin")
    if (erroPapel) throw erroPapel
    if (!ehAdmin) throw new Error("Só o próprio analista ou um admin pode excluir o apontamento.")
  }

  const { error } = await supabase.from("apontamento_horas").delete().eq("id", apontamentoId)
  if (error) throw error

  revalidatePath(`/chamados/${apontamento.ticket_id}`)
}
