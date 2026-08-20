"use client"

import { useId, useRef, useState, type ChangeEvent } from "react"
import { Lock, Paperclip, X } from "lucide-react"
import dynamic from "next/dynamic"
import type { JSONContent } from "@tiptap/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { documentoTemConteudo } from "@/lib/comentario/render-html"
import { anexarArquivo, removerAnexo } from "@/lib/tickets/anexos"
import { registrarManual } from "@/lib/tickets/apontamentos"

// Tiptap renderiza no cliente: sem ssr:false a árvore montada no servidor
// diverge da primeira renderização no cliente (C9) -- mesma cicatriz de
// hidratação já documentada em chamado-detalhe-client.tsx e sla-clock.tsx.
const ComentarioEditor = dynamic(
  () => import("@/components/chamado/comentario-editor").then((m) => m.ComentarioEditor),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-md border border-input bg-muted/40" /> }
)

interface NovoComentarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number
  // Devolve uma Promise que resolve só depois que o comentário está de fato
  // persistido -- o modal usa isso para inverter a ordem: gravar o
  // comentário e SÓ DEPOIS o apontamento de horas, nunca o contrário
  // (se o comentário falhasse depois de já ter gravado horas, ficaria um
  // apontamento órfão sem o texto que o justifica).
  onEnviar: (corpo: string, interno: boolean, documentoRico: JSONContent, anexoIds: string[]) => Promise<void>
  mostrarNotaInterna?: boolean
}

// HH:mm -> minutos. Aceita "1:30", "01:30"; qualquer outra coisa é inválida
// (fica pro usuário corrigir, sem quebrar o formulário).
function minutosDoCampo(valor: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(valor.trim())
  if (!match) return null
  const minutos = Number(match[1]) * 60 + Number(match[2])
  return minutos > 0 ? minutos : null
}

// Caminho completo do "Comentários": textarea + interno/público + horas
// opcional (design.md D6) — grava comentário e, se horas preenchido, um
// apontamento junto, em duas chamadas de servidor separadas (não uma nova
// action combinada, pra não duplicar a lógica de SLA que já vive em
// adicionarComentario). O composer inline continua existindo à parte, como
// caminho rápido sem abrir modal.
export function NovoComentarioDialog({
  open,
  onOpenChange,
  ticketNumero,
  onEnviar,
  mostrarNotaInterna = true,
}: NovoComentarioDialogProps) {
  const [documentoRico, setDocumentoRico] = useState<JSONContent | null>(null)
  const [textoPlano, setTextoPlano] = useState("")
  const [interno, setInterno] = useState(false)
  const [horas, setHoras] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [anexosPendentes, setAnexosPendentes] = useState<{ id: string; nome: string }[]>([])
  const [anexando, setAnexando] = useState(false)
  const horasId = useId()
  const arquivoInputRef = useRef<HTMLInputElement>(null)
  // documentoTemConteudo, não textoPlano.trim() -- um comentário só com
  // imagem (sem nenhuma palavra) é válido, mas getText() do Tiptap não
  // enxerga nó de imagem. Só textoPlano travava o botão "Adicionar" mesmo
  // com a imagem já inserida.
  const temConteudo = documentoRico ? documentoTemConteudo(documentoRico) : false

  function fechar() {
    setDocumentoRico(null)
    setTextoPlano("")
    setInterno(false)
    setHoras("")
    // Os arquivos já subiram pro bucket -- não apagar ao fechar sem enviar,
    // viram anexos normais do chamado (mesmo sem link a um comentário).
    setAnexosPendentes([])
    onOpenChange(false)
  }

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ""
    if (!arquivo) return

    setAnexando(true)
    try {
      const formData = new FormData()
      formData.set("arquivo", arquivo)
      const { id } = await anexarArquivo(formData, { ticketNumero, inline: false, revalidar: false })
      setAnexosPendentes((atual) => [...atual, { id, nome: arquivo.name }])
    } catch {
      toast.error("Não foi possível anexar o arquivo.")
    } finally {
      setAnexando(false)
    }
  }

  async function removerAnexoPendente(id: string) {
    setAnexosPendentes((atual) => atual.filter((a) => a.id !== id))
    try {
      await removerAnexo(id)
    } catch {
      toast.error("Não foi possível remover o anexo.")
    }
  }

  async function enviar() {
    if (!temConteudo || !documentoRico) return

    let minutos: number | null = null
    if (horas.trim()) {
      minutos = minutosDoCampo(horas)
      if (minutos === null) {
        toast.error("Horas inválidas — use o formato HH:mm.")
        return
      }
    }

    setEnviando(true)
    try {
      await onEnviar(
        textoPlano,
        interno,
        documentoRico,
        anexosPendentes.map((a) => a.id)
      )
    } catch {
      toast.error("Não foi possível enviar o comentário.")
      setEnviando(false)
      return
    }

    if (minutos !== null) {
      try {
        await registrarManual({ ticketNumero, minutos, descricao: textoPlano, faturavel: true })
      } catch {
        toast.error("Comentário enviado, mas não foi possível registrar as horas.")
        setEnviando(false)
        return
      }
    }

    setEnviando(false)
    fechar()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : fechar())}>
      {/* Tamanho pedido pelo usuário depois de comparar com o modal de
          comentário do Milvus (bem mais largo/alto que os outros diálogos do
          app) -- max-h + overflow-y-auto porque em telas baixas o editor
          maior não cabe inteiro na viewport. */}
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo comentário</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <ComentarioEditor
              ticketNumero={ticketNumero}
              placeholder={
                interno
                  ? "Nota interna — não visível ao solicitante (pode colar uma imagem)"
                  : "Insira ou cole seu texto ou imagem aqui…"
              }
              interno={interno}
              onChange={(doc, texto) => {
                setDocumentoRico(doc)
                setTextoPlano(texto)
              }}
            />
          </Field>

          <Field className="flex-row items-end gap-4">
            <div>
              <FieldLabel htmlFor={horasId}>Horas (opcional)</FieldLabel>
              <Input
                id={horasId}
                placeholder="HH:mm"
                inputMode="numeric"
                value={horas}
                onChange={(event) => setHoras(event.target.value)}
                className="w-28"
              />
            </div>

            <div>
              <input
                ref={arquivoInputRef}
                type="file"
                className="hidden"
                onChange={selecionarArquivo}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={anexando}
                onClick={() => arquivoInputRef.current?.click()}
              >
                <Paperclip className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                {anexando ? "Anexando..." : "Anexar arquivo"}
              </Button>
            </div>
          </Field>

          {anexosPendentes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anexosPendentes.map((anexo) => (
                <span
                  key={anexo.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-xs"
                >
                  {anexo.nome}
                  <button
                    type="button"
                    className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => removerAnexoPendente(anexo.id)}
                    aria-label={`Remover anexo ${anexo.nome}`}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </FieldGroup>

        <DialogFooter className="items-center sm:justify-between">
          {mostrarNotaInterna ? (
            <Button
              type="button"
              variant={interno ? "secondary" : "ghost"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setInterno((v) => !v)}
            >
              <Lock className="size-3.5" data-icon="inline-start" aria-hidden="true" />
              {interno ? "Nota interna" : "Marcar como interno"}
            </Button>
          ) : (
            <span />
          )}
          <Button className="cursor-pointer" onClick={enviar} disabled={enviando || !temConteudo}>
            {enviando ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
