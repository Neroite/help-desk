"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReferenceData } from "@/lib/reference-data/provider"
import { atribuirEMover } from "@/lib/tickets/actions"
import type { StatusKey } from "@/lib/types"

interface AtribuirTecnicoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumero: number | null
  destino: StatusKey | null
  rotuloDestino: string
  onSucesso: (numero: number, analistaId: string, destino: StatusKey) => void
}

// Aberto quando o Kanban recusa um drop por falta de técnico (ver
// lib/kanban/colunas.ts#dropPermitido, resultado "exige-tecnico") --
// escolher o técnico aqui completa a movimentação numa chamada só
// (atribuirEMover), sem precisar arrastar de novo.
export function AtribuirTecnicoDialog({
  open,
  onOpenChange,
  ticketNumero,
  destino,
  rotuloDestino,
  onSucesso,
}: AtribuirTecnicoDialogProps) {
  const { usuarios, usuarioAtual } = useReferenceData()
  const analistas = usuarios.filter((u) => u.papel === "analista")
  const souAnalista = usuarioAtual?.papel === "analista"

  const [analistaId, setAnalistaId] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Remonta a seleção a cada abertura -- pré-marca "eu" quando o usuário
  // atual é analista, senão começa vazio.
  useEffect(() => {
    if (open) setAnalistaId(souAnalista ? (usuarioAtual?.id ?? "") : "")
  }, [open, souAnalista, usuarioAtual?.id])

  async function handleConfirmar() {
    if (!ticketNumero || !destino || !analistaId) return
    setSalvando(true)
    try {
      await atribuirEMover(ticketNumero, analistaId, destino)
      onSucesso(ticketNumero, analistaId, destino)
      onOpenChange(false)
    } catch {
      toast.error(`Não foi possível atribuir o chamado #${ticketNumero}.`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atribuir técnico</DialogTitle>
          <DialogDescription>
            Este chamado precisa de um técnico antes de ir para &ldquo;{rotuloDestino}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="atribuir-tecnico-select">Técnico</FieldLabel>
            <Select value={analistaId} onValueChange={(value) => setAnalistaId(value ?? "")}>
              <SelectTrigger id="atribuir-tecnico-select" className="w-full">
                <SelectValue placeholder="Selecione">
                  {(value: string) => analistas.find((a) => a.id === value)?.nome}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {analistas.map((analista) => (
                    <SelectItem key={analista.id} value={analista.id}>
                      {analista.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {souAnalista && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={analistaId === usuarioAtual?.id}
                onCheckedChange={(checked) => setAnalistaId(checked === true ? (usuarioAtual?.id ?? "") : "")}
              />
              Assumir eu
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={salvando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button className="cursor-pointer" disabled={salvando || !analistaId} onClick={handleConfirmar}>
            Atribuir e mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
