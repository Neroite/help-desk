"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { criarTicketFilho } from "@/lib/tickets/actions"

interface CriarTicketFilhoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paiNumero: number
}

// Divide o chamado em ações menores por setor — o filho herda cliente e
// solicitante do pai automaticamente (lib/tickets/actions.ts#criarTicketFilho).
export function CriarTicketFilhoDialog({ open, onOpenChange, paiNumero }: CriarTicketFilhoDialogProps) {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [criando, setCriando] = useState(false)

  function fechar() {
    setTitulo("")
    setDescricao("")
    onOpenChange(false)
  }

  async function criar() {
    if (!titulo.trim()) return
    setCriando(true)
    try {
      const { numero } = await criarTicketFilho({ paiNumero, titulo, descricao })
      toast.success(`Chamado filho #${numero} criado`)
      fechar()
      router.refresh()
    } catch {
      toast.error("Não foi possível criar o chamado filho.")
    } finally {
      setCriando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : fechar())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar chamado filho de #{paiNumero}</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="filho-titulo">Título</FieldLabel>
            <Input id="filho-titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} autoFocus />
          </Field>
          <Field>
            <FieldLabel htmlFor="filho-descricao">Descrição</FieldLabel>
            <Textarea
              id="filho-descricao"
              rows={4}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={fechar}>
            Cancelar
          </Button>
          <Button className="cursor-pointer" onClick={criar} disabled={criando || !titulo.trim()}>
            {criando ? "Criando..." : "Criar chamado filho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
