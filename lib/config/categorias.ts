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
