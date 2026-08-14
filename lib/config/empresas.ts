"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { STATUS_KEYS, type StatusKey } from "@/lib/types"

// 5 dos 6 status são obrigatórios em toda empresa — só "aguardando_aprovacao"
// é uma escolha real (algumas empresas não usam etapa de aprovação). Fixado
// aqui, não confiamos no que vier do client (defesa em profundidade: um
// payload de formulário adulterado não deveria conseguir desligar "Pausado"
// pra ninguém).
function montarLinhasStatus(
  empresaId: string,
  aguardandoAprovacaoAtivo: boolean,
  rotulos: Partial<Record<StatusKey, string>>
) {
  return STATUS_KEYS.map((statusKey) => ({
    empresa_id: empresaId,
    status_key: statusKey,
    ativo: statusKey === "aguardando_aprovacao" ? aguardandoAprovacaoAtivo : true,
    rotulo: rotulos[statusKey]?.trim() || null,
  }))
}

export async function criarEmpresa(
  nome: string,
  cnpj: string,
  aguardandoAprovacaoAtivo: boolean,
  rotulos: Partial<Record<StatusKey, string>>
): Promise<void> {
  const supabase = await createClient()

  const { data: empresa, error: erroEmpresa } = await supabase
    .from("empresa")
    .insert({ nome, cnpj, ativo: true })
    .select("id")
    .single()
  if (erroEmpresa) throw erroEmpresa

  const { error: erroStatus } = await supabase
    .from("empresa_status")
    .insert(montarLinhasStatus(empresa.id, aguardandoAprovacaoAtivo, rotulos))
  if (erroStatus) throw erroStatus

  revalidatePath("/configuracoes/empresas")
}

export async function atualizarEmpresa(
  id: string,
  nome: string,
  cnpj: string,
  aguardandoAprovacaoAtivo: boolean,
  rotulos: Partial<Record<StatusKey, string>>
): Promise<void> {
  const supabase = await createClient()

  const { error: erroEmpresa } = await supabase
    .from("empresa")
    .update({ nome, cnpj })
    .eq("id", id)
  if (erroEmpresa) throw erroEmpresa

  const { error: erroStatus } = await supabase
    .from("empresa_status")
    .upsert(montarLinhasStatus(id, aguardandoAprovacaoAtivo, rotulos), {
      onConflict: "empresa_id,status_key",
    })
  if (erroStatus) throw erroStatus

  revalidatePath("/configuracoes/empresas")
}
