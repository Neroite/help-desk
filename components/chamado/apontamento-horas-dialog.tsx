"use client"

import { ApontamentoHoras } from "@/components/chamado/apontamento-horas"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ApontamentoHoras as ApontamentoHorasItem } from "@/lib/types"

interface ApontamentoHorasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number
  apontamentos: ApontamentoHorasItem[]
  timerAberto: ApontamentoHorasItem | null
}

// Modal aberto pela pill "Horas" do detalhe — mesmo conteúdo (totalizador +
// lista + lançar) que já vivia fixo no aside; aqui só embrulha num Dialog
// pra caber a referência Milvus de "clicar em Horas abre uma tela cheia".
export function ApontamentoHorasDialog({
  open,
  onOpenChange,
  ticketNumero,
  apontamentos,
  timerAberto,
}: ApontamentoHorasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Apontamento de horas · #{ticketNumero}</DialogTitle>
        </DialogHeader>
        <ApontamentoHoras ticketNumero={ticketNumero} apontamentos={apontamentos} timerAberto={timerAberto} />
      </DialogContent>
    </Dialog>
  )
}
