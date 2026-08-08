import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

// force-dynamic + no-store: um GET /logout com resposta cacheável faz o
// navegador servir o 307 antigo do cache sem nunca chamar signOut() de
// novo — sessão nunca cai.
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL("/login", request.url))
  response.headers.set("Cache-Control", "no-store")
  return response
}
