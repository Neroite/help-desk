"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { conciliarChamado } from "@/lib/tickets/actions"

interface ConciliarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  principalNumero: number
}

// Unifica chamados duplicados: o principal (este) permanece ativo, o
// duplicado informado aqui é anexado e finalizado — funciona com os dois em
// qualquer status (lib/tickets/actions.ts#conciliarChamado).
export function ConciliarDialog({ open, onOpenChange, principalNumero }: ConciliarDialogProps) {
  const router = useRouter()
  const [duplicadoNumero, setDuplicadoNumero] = useState("")
  const [conciliando, setConciliando] = useState(false)

  function fechar() {
    setDuplicadoNumero("")
    onOpenChange(false)
  }

  async function conciliar() {
    const numero = Number(duplicadoNumero)
    if (!Number.isInteger(numero) || numero <= 0) {
      toast.error("Informe um número de chamado válido.")
      return
    }
    setConciliando(true)
    try {
      await conciliarChamado(principalNumero, numero)
      toast.success(`Chamado #${numero} conciliado como duplicado`)
      fechar()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível conciliar os chamados.")
    } finally {
      setConciliando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : fechar())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Conciliar chamado duplicado</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="duplicado-numero">
            Número do chamado duplicado que será anexado a #{principalNumero}
          </FieldLabel>
          <Input
            id="duplicado-numero"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Ex.: 42"
            value={duplicadoNumero}
            onChange={(event) => setDuplicadoNumero(event.target.value)}
            autoFocus
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={fechar}>
            Cancelar
          </Button>
          <Button className="cursor-pointer" onClick={conciliar} disabled={conciliando}>
            {conciliando ? "Conciliando..." : "Conciliar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
