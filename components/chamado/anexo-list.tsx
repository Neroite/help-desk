"use client"

import { useRef, useState } from "react"
import { FileText, ImageIcon, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useReferenceData } from "@/lib/reference-data/provider"
import { anexarArquivo, gerarUrlAssinada, removerAnexo } from "@/lib/tickets/anexos"
import type { Anexo } from "@/lib/types"

interface AnexoListProps {
  anexos: Anexo[]
  /**
   * Chamado dono dos anexos. `null`/ausente no formulário de abertura, onde o
   * chamado ainda não existe e portanto não há onde pendurar o arquivo.
   */
  ticketNumero?: number | null
  /**
   * Modo pendente (F10): sem `ticketNumero`, o formulário de abertura ainda
   * assim deixa escolher arquivo -- fica em memória como `File[]` (chips
   * removíveis) e quem preenche o form sobe via `anexarArquivo` depois que
   * `criarChamado` devolver o número. O path do storage é contratual (a
   * policy extrai o número do 2º segmento), então não dá pra subir antes de
   * o chamado existir -- só segurar o arquivo no cliente.
   */
  pendentes?: File[]
  onPendentesChange?: (arquivos: File[]) => void
}

const formatadorTamanho = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 })

function formatarTamanho(kb: number): string {
  return kb >= 1024
    ? `${formatadorTamanho.format(kb / 1024)} MB`
    : `${formatadorTamanho.format(kb)} KB`
}

function formatarTamanhoBytes(bytes: number): string {
  return formatarTamanho(bytes / 1024)
}

export function AnexoList({ anexos, ticketNumero, pendentes, onPendentesChange }: AnexoListProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processando, setProcessando] = useState(false)
  const { usuarioAtual } = useReferenceData()

  const podeAnexar = typeof ticketNumero === "number"
  const modoPendente = !podeAnexar && Boolean(onPendentesChange)
  // Remoção é do staff (mesma regra da policy `anexo_staff_delete`).
  const podeRemover =
    usuarioAtual?.papel === "admin" || usuarioAtual?.papel === "analista"

  async function enviar(arquivo: File) {
    if (modoPendente) {
      onPendentesChange?.([...(pendentes ?? []), arquivo])
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    if (!podeAnexar) return
    const formData = new FormData()
    formData.set("arquivo", arquivo)

    setProcessando(true)
    try {
      await anexarArquivo(formData, { ticketNumero })
      toast.success("Anexo enviado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o anexo.")
    } finally {
      setProcessando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function removerPendente(index: number) {
    onPendentesChange?.((pendentes ?? []).filter((_, i) => i !== index))
  }

  async function abrir(anexoId: string) {
    setProcessando(true)
    try {
      const url = await gerarUrlAssinada(anexoId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o anexo.")
    } finally {
      setProcessando(false)
    }
  }

  async function remover(anexoId: string) {
    setProcessando(true)
    try {
      await removerAnexo(anexoId)
      toast.success("Anexo removido.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o anexo.")
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {anexos.map((anexo) => {
          const Icon = anexo.tipo === "imagem" ? ImageIcon : FileText
          return (
            <li
              key={anexo.id}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <button
                type="button"
                className="cursor-pointer truncate text-foreground hover:underline"
                disabled={processando}
                onClick={() => abrir(anexo.id)}
              >
                {anexo.nome}
              </button>
              <span className="ml-auto shrink-0 font-tabular text-muted-foreground">
                {formatarTamanho(anexo.tamanhoKb)}
              </span>
              {podeRemover && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="size-6 shrink-0 p-0"
                  aria-label={`Remover ${anexo.nome}`}
                  disabled={processando}
                  onClick={() => remover(anexo.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </li>
          )
        })}

        {modoPendente &&
          (pendentes ?? []).map((arquivo, index) => (
            <li
              key={`${arquivo.name}-${arquivo.size}-${index}`}
              className="flex items-center gap-2 rounded-md border border-dashed border-border px-2 py-1.5 text-xs"
            >
              {arquivo.type.startsWith("image/") ? (
                <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="truncate text-foreground">{arquivo.name}</span>
              <span className="ml-auto shrink-0 font-tabular text-muted-foreground">
                {formatarTamanhoBytes(arquivo.size)}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="size-6 shrink-0 p-0"
                aria-label={`Remover ${arquivo.name}`}
                onClick={() => removerPendente(index)}
              >
                <Trash2 className="size-3" />
              </Button>
            </li>
          ))}
      </ul>

      {(podeAnexar || modoPendente) && (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const arquivo = event.target.files?.[0]
              if (arquivo) void enviar(arquivo)
            }}
          />
          <button
            type="button"
            disabled={processando}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            {processando ? "Enviando..." : "Anexar arquivo"}
          </button>
        </>
      )}

      {!podeAnexar && !modoPendente && (
        <p className="text-xs text-muted-foreground">
          Anexos podem ser enviados depois que o chamado for aberto.
        </p>
      )}
    </div>
  )
}
