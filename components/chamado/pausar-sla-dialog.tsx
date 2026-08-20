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
import { pausarSlaManualmente } from "@/lib/tickets/actions"

const MOTIVO_MAX = 280

interface PausarSlaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number | null
  onSucesso: () => void
}

// Igual a pausar-dialog.tsx, mas SEM mudar status_key -- só o relógio de
// SLA congela, o chamado continua no status em que está (ver
// lib/tickets/actions.ts#pausarSlaManualmente).
export function PausarSlaDialog({ open, onOpenChange, ticketNumero, onSucesso }: PausarSlaDialogProps) {
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
      await pausarSlaManualmente(ticketNumero, motivoLimpo)
      onSucesso()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível pausar o SLA.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pausar SLA</DialogTitle>
          <DialogDescription>
            O prazo de SLA congela, mas o status do chamado não muda. O motivo fica registrado na conversa.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="pausar-sla-motivo">Motivo</FieldLabel>
          <Textarea
            id="pausar-sla-motivo"
            value={motivo}
            maxLength={MOTIVO_MAX}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Ex.: aguardando retorno do cliente por outro canal"
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
            Pausar SLA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
