"use client"

import { AnexoList } from "@/components/chamado/anexo-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Anexo } from "@/lib/types"

interface AnexosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number
  anexos: Anexo[]
}

// Modal aberto pela pill "Anexos" do detalhe -- mesmo padrão de
// ApontamentoHorasDialog: a pill deixou de filtrar a timeline (ver
// chamado-conversa-rica) e passou a abrir a lista completa num Dialog.
export function AnexosDialog({ open, onOpenChange, ticketNumero, anexos }: AnexosDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Anexos · #{ticketNumero}</DialogTitle>
        </DialogHeader>
        <AnexoList anexos={anexos} ticketNumero={ticketNumero} />
      </DialogContent>
    </Dialog>
  )
}
