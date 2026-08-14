"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

// Não exportado: num módulo "use server" todo export precisa ser função
// async — exportar uma constante invalida o módulo inteiro no build.
const BUCKET_ANEXOS = "helpdesk-anexos"

// Espelha `file_size_limit` do bucket (migration 20260813210500). Checar aqui
// também dá mensagem em português em vez do erro cru do Storage.
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

// Signed URL curta: o link serve para o clique que acabou de acontecer, não
// para ser copiado e compartilhado fora do sistema.
const SEGUNDOS_URL_ASSINADA = 60

/**
 * Path do objeto no bucket: `ticket/<numero>/<uuid>-<nome>`.
 *
 * O número do chamado precisa ser o segundo segmento porque as policies de
 * `storage.objects` extraem justamente daí quem pode ver o arquivo
 * (`helpdesk.anexo_ticket_do_path`). Mudar este formato exige mudar a policy.
 */
function montarPath(ticketNumero: number, nomeArquivo: string): string {
  const seguro = nomeArquivo.replace(/[^\w.\-]/g, "_")
  return `ticket/${ticketNumero}/${crypto.randomUUID()}-${seguro}`
}

export interface AnexarArquivoInput {
  ticketNumero: number
  comentarioId?: string | null
}

/**
 * Sobe o binário e grava o metadado. Recebe FormData porque `File` não
 * atravessa a fronteira de Server Action como objeto simples.
 */
export async function anexarArquivo(
  formData: FormData,
  input: AnexarArquivoInput
): Promise<void> {
  const arquivo = formData.get("arquivo")
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo para anexar.")
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new Error("Arquivo maior que o limite de 10 MB.")
  }

  const supabase = await createClient()
  const path = montarPath(input.ticketNumero, arquivo.name)

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .upload(path, arquivo, { contentType: arquivo.type || undefined, upsert: false })
  if (erroUpload) throw erroUpload

  const { error: erroMetadado } = await supabase.from("anexo").insert({
    ticket_id: input.ticketNumero,
    comentario_id: input.comentarioId ?? null,
    storage_path: path,
    nome: arquivo.name,
    tamanho: arquivo.size,
  })

  // Metadado é o que a aplicação enxerga; sem ele o objeto vira lixo invisível
  // no bucket. Se o insert falhar, desfaz o upload antes de propagar o erro.
  if (erroMetadado) {
    await supabase.storage.from(BUCKET_ANEXOS).remove([path])
    throw erroMetadado
  }

  revalidatePath(`/chamados/${input.ticketNumero}`)
  revalidatePath(`/portal/chamados/${input.ticketNumero}`)
}

/**
 * URL temporária para baixar/visualizar o anexo. O bucket é privado, então
 * este é o único caminho de leitura do binário.
 */
export async function gerarUrlAssinada(anexoId: string): Promise<string> {
  const supabase = await createClient()

  // O select passa pela RLS de helpdesk.anexo: quem não pode ver o chamado
  // não recupera o storage_path e portanto não chega a pedir a URL.
  const { data: anexo, error: erroBusca } = await supabase
    .from("anexo")
    .select("storage_path")
    .eq("id", anexoId)
    .single()
  if (erroBusca) throw erroBusca

  const { data, error } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(anexo.storage_path, SEGUNDOS_URL_ASSINADA)
  if (error) throw error

  return data.signedUrl
}

export async function removerAnexo(anexoId: string): Promise<void> {
  const supabase = await createClient()

  const { data: anexo, error: erroBusca } = await supabase
    .from("anexo")
    .select("storage_path, ticket_id")
    .eq("id", anexoId)
    .single()
  if (erroBusca) throw erroBusca

  // Metadado primeiro: se a RLS barrar (não-staff), nada é apagado do bucket.
  const { error: erroMetadado } = await supabase.from("anexo").delete().eq("id", anexoId)
  if (erroMetadado) throw erroMetadado

  const { error: erroStorage } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .remove([anexo.storage_path])
  if (erroStorage) throw erroStorage

  if (anexo.ticket_id) {
    revalidatePath(`/chamados/${anexo.ticket_id}`)
    revalidatePath(`/portal/chamados/${anexo.ticket_id}`)
  }
}
