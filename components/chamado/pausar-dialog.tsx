"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { pausarChamado } from "@/lib/tickets/actions"

const MOTIVO_MAX = 280

interface PausarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number | null
  onSucesso: (numero: number) => void
}

// Pausar sempre exige motivo -- vira o corpo do evento "pausa" na timeline
// (ver ticket-timeline.tsx), não um "Status: X → Pausado" genérico.
export function PausarDialog({ open, onOpenChange, ticketNumero, onSucesso }: PausarDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open) setMotivo("")
  }, [open])

  async function handleConfirmar() {
    const motivoLimpo = motivo.trim()
    if (!ticketNumero || !motivoLimpo) return
    setSalvando(true)
    try {
      await pausarChamado(ticketNumero, motivoLimpo)
      onSucesso(ticketNumero)
      onOpenChange(false)
    } catch {
      toast.error(`Não foi possível pausar o chamado #${ticketNumero}.`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pausar chamado</DialogTitle>
          <DialogDescription>O motivo fica registrado na conversa e o prazo de SLA congela.</DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="pausar-motivo">Motivo</FieldLabel>
          <Textarea
            id="pausar-motivo"
            value={motivo}
            maxLength={MOTIVO_MAX}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Ex.: aguardando peça do fornecedor"
            rows={3}
          />
          <span className="text-right text-xs text-muted-foreground">
            {motivo.length}/{MOTIVO_MAX}
          </span>
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={salvando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="cursor-pointer"
            disabled={salvando || motivo.trim().length === 0}
            onClick={handleConfirmar}
          >
            Pausar chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
