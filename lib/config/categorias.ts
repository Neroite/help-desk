"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function criarCategoriaAtendimento(nome: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("categoria_atendimento").insert({ nome })
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}

export async function atualizarCategoriaAtendimento(id: string, nome: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("categoria_atendimento").update({ nome }).eq("id", id)
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}

export async function criarCategoriaProblema(nome: string, paiId: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("categoria_problema").insert({ nome, pai_id: paiId })
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}

export async function atualizarCategoriaProblema(
  id: string,
  nome: string,
  paiId: string | null
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("categoria_problema")
    .update({ nome, pai_id: paiId })
    .eq("id", id)
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}

export async function excluirCategoriaAtendimento(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: emUso } = await supabase
    .from("ticket")
    .select("numero")
    .eq("cat_atendimento_id", id)
    .limit(1)
  if (emUso && emUso.length > 0) {
    throw new Error("Categoria em uso por um ou mais chamados — não pode ser excluída.")
  }

  const { error } = await supabase.from("categoria_atendimento").delete().eq("id", id)
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}

export async function excluirCategoriaProblema(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: filhas } = await supabase
    .from("categoria_problema")
    .select("id")
    .eq("pai_id", id)
    .limit(1)
  if (filhas && filhas.length > 0) {
    throw new Error("Categoria tem subcategorias vinculadas — exclua-as primeiro.")
  }

  const { data: emUso } = await supabase
    .from("ticket")
    .select("numero")
    .eq("cat_problema_id", id)
    .limit(1)
  if (emUso && emUso.length > 0) {
    throw new Error("Categoria em uso por um ou mais chamados — não pode ser excluída.")
  }

  const { error } = await supabase.from("categoria_problema").delete().eq("id", id)
  if (error) throw error

  revalidatePath("/configuracoes/categorias")
}
