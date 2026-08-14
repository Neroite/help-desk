"use server"

import { createClient } from "@/lib/supabase/server"

export interface ChamadoParaAvaliar {
  numero: number
  titulo: string
  jaAvaliado: boolean
}

// Toda a rota /avaliar/[token] é pública (ver ROTAS_PUBLICAS no middleware) e
// conversa com o banco só por estas duas RPCs. Nenhuma tabela é lida direto:
// sem sessão, `helpdesk.current_empresa_id()` é null e a RLS negaria tudo —
// e abrir SELECT anônimo em `ticket` vazaria chamados de outras empresas.

export async function buscarChamadoPorToken(
  token: string
): Promise<ChamadoParaAvaliar | null> {
  // Token que não é UUID nem chega ao banco (o cast na RPC estouraria).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("chamado_por_token", { p_token: token })
  if (error) throw error

  const linha = data?.[0]
  if (!linha) return null

  return { numero: linha.numero, titulo: linha.titulo, jaAvaliado: linha.ja_avaliado }
}

export async function avaliarPorToken(
  token: string,
  estrelas: number,
  comentario: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("avaliar_por_token", {
    p_token: token,
    p_estrelas: estrelas,
    p_comentario: comentario.trim() || null,
  })
  if (error) throw error
}
