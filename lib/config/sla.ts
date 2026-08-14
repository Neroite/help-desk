"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { Prioridade } from "@/lib/types"

export async function atualizarSlaPolicy(
  prioridade: Prioridade | null,
  minutosResposta: number,
  minutosSolucao: number
): Promise<void> {
  const supabase = await createClient()

  const atualizacao = {
    minutos_resposta: minutosResposta,
    minutos_solucao: minutosSolucao,
  }

  if (prioridade === null) {
    const { error } = await supabase.from("sla_policy").update(atualizacao).is("prioridade", null)
    if (error) throw error
  } else {
    const { error } = await supabase.from("sla_policy").update(atualizacao).eq("prioridade", prioridade)
    if (error) throw error
  }

  revalidatePath("/configuracoes/sla")
}
