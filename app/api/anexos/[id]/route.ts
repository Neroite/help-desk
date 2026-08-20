import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const BUCKET_ANEXOS = "helpdesk-anexos"
const SEGUNDOS_URL_ASSINADA = 60

// Allowlist estrita -- este é o único jeito de um <img src> do editor rich
// text (F5) resolver pra um binário de verdade, e o bucket é privado. Servir
// .svg ou .html inline do próprio domínio seria XSS de fato; qualquer coisa
// fora de imagem raster comum responde 415, não é redirecionada.
const TIPOS_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"])

/**
 * GET /api/anexos/<id> -- reemite uma signed URL fresca do Storage.
 *
 * Existe porque uma `<img src>` fixa com signed URL de 60s (gerarUrlAssinada)
 * quebraria assim que expirasse. O `src` gravado no HTML do comentário é
 * estável (`/api/anexos/<id>`); esta rota autentica pelo cliente de cookies
 * -- então a RLS de `helpdesk.anexo` aplica normalmente -- e responde 307
 * para uma URL assinada nova a cada chamada.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const supabase = await createClient()

  // RLS decide: quem não pode ver o chamado deste anexo não recebe a linha.
  // Sem linha -> 404, nunca 403 (não vazar "existe mas você não pode ver").
  const { data: anexo, error } = await supabase
    .from("anexo")
    .select("storage_path")
    .eq("id", id)
    .single()
  if (error || !anexo) {
    return NextResponse.json({ erro: "Anexo não encontrado." }, { status: 404 })
  }

  const { data: listagem, error: erroListagem } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .list(anexo.storage_path.split("/").slice(0, -1).join("/"), {
      search: anexo.storage_path.split("/").at(-1),
    })
  const tipo = listagem?.[0]?.metadata?.mimetype as string | undefined
  if (erroListagem || !tipo || !TIPOS_PERMITIDOS.has(tipo)) {
    return NextResponse.json({ erro: "Tipo de arquivo não suportado." }, { status: 415 })
  }

  const { data: assinada, error: erroAssinatura } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(anexo.storage_path, SEGUNDOS_URL_ASSINADA)
  if (erroAssinatura) {
    return NextResponse.json({ erro: "Não foi possível gerar o link do anexo." }, { status: 500 })
  }

  return NextResponse.redirect(assinada.signedUrl, 307)
}
