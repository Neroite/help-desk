"use client"

import { useId, useState } from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { registrarManual } from "@/lib/tickets/apontamentos"
import { cn } from "@/lib/utils"

interface NovoComentarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number
  onEnviar: (corpo: string, interno: boolean) => void
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
  const [corpo, setCorpo] = useState("")
  const [interno, setInterno] = useState(false)
  const [horas, setHoras] = useState("")
  const [enviando, setEnviando] = useState(false)
  const textareaId = useId()
  const horasId = useId()

  function fechar() {
    setCorpo("")
    setInterno(false)
    setHoras("")
    onOpenChange(false)
  }

  async function enviar() {
    if (!corpo.trim()) return

    if (horas.trim()) {
      const minutos = minutosDoCampo(horas)
      if (minutos === null) {
        toast.error("Horas inválidas — use o formato HH:mm.")
        return
      }
      setEnviando(true)
      try {
        await registrarManual({ ticketNumero, minutos, descricao: corpo, faturavel: true })
      } catch {
        toast.error("Não foi possível registrar as horas do comentário.")
        setEnviando(false)
        return
      }
      setEnviando(false)
    }

    onEnviar(corpo, interno)
    fechar()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : fechar())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo comentário</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <label htmlFor={textareaId} className="sr-only">
              {interno ? "Nota interna" : "Resposta ao solicitante"}
            </label>
            <Textarea
              id={textareaId}
              placeholder={
                interno ? "Nota interna — não visível ao solicitante" : "Insira seu texto aqui…"
              }
              value={corpo}
              onChange={(event) => setCorpo(event.target.value)}
              rows={6}
              className={cn(interno && "border-accent/50 bg-accent/5")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={horasId}>Horas (opcional)</FieldLabel>
            <Input
              id={horasId}
              placeholder="HH:mm"
              inputMode="numeric"
              value={horas}
              onChange={(event) => setHoras(event.target.value)}
              className="w-28"
            />
          </Field>
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
          <Button className="cursor-pointer" onClick={enviar} disabled={enviando || !corpo.trim()}>
            {enviando ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
