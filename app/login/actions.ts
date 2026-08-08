"use server"

import { redirect } from "next/navigation"

import { redirectPorPapel } from "@/lib/auth/redirect-por-papel"
import { createClient } from "@/lib/supabase/server"
import type { Papel } from "@/lib/types"

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const senha = String(formData.get("senha") ?? "")

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error || !data.user) {
    redirect(`/login?erro=${encodeURIComponent("E-mail ou senha inválidos")}`)
  }

  const { data: usuario } = await supabase
    .from("usuario")
    .select("papel")
    .eq("id", data.user.id)
    .single()

  if (!usuario) {
    redirect(`/login?erro=${encodeURIComponent("Usuário sem acesso configurado")}`)
  }

  redirect(redirectPorPapel(usuario.papel as Papel))
}
