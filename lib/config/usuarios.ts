"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { Papel } from "@/lib/types"

// Só solicitante pertence a uma empresa — admin e analista são da equipe
// (modelo MSP: uma equipe atende N empresas-clientes). A UI já desabilita o
// Select de empresa quando o papel não é solicitante, mas a regra é aplicada
// aqui também: um payload adulterado não deve conseguir prender um analista
// a uma empresa e, por tabela, restringir o que ele enxerga.
//
// O banco reforça a metade oposta com a constraint
// `usuario_solicitante_tem_empresa` (solicitante precisa ter empresa).
function normalizarEmpresaId(papel: Papel, empresaId: string | null): string | null {
  return papel === "solicitante" ? empresaId : null
}

export async function atualizarUsuario(
  id: string,
  nome: string,
  papel: Papel,
  empresaId: string | null
): Promise<void> {
  const nomeLimpo = nome.trim()
  if (!nomeLimpo) throw new Error("Informe o nome do usuário.")

  const empresaFinal = normalizarEmpresaId(papel, empresaId)
  if (papel === "solicitante" && !empresaFinal) {
    throw new Error("Solicitante precisa estar vinculado a uma empresa.")
  }

  const supabase = await createClient()

  // `email` não entra no update de propósito: o e-mail de verdade mora em
  // auth.users e é o que autentica. Alterar só a cópia em helpdesk.usuario
  // dessincronizaria o login. Troca de e-mail é fluxo do Supabase Auth.
  const { error } = await supabase
    .from("usuario")
    .update({ nome: nomeLimpo, papel, empresa_id: empresaFinal })
    .eq("id", id)
  if (error) throw error

  revalidatePath("/configuracoes/usuarios")
}
