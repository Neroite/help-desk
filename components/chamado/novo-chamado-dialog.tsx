"use client"

import { createContext, useContext, useId, useState, type ReactNode } from "react"

import { NovoChamadoForm } from "@/components/chamado/novo-chamado-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NovoChamadoContextValue {
  abrir: () => void
}

const NovoChamadoContext = createContext<NovoChamadoContextValue | null>(null)

export function useNovoChamado() {
  const ctx = useContext(NovoChamadoContext)
  if (!ctx) throw new Error("useNovoChamado precisa estar dentro de NovoChamadoProvider")
  return ctx
}

// Um único Dialog montado aqui — os gatilhos ("+ Ticket" na topbar, "+ Novo
// chamado" na fila) só chamam abrir() via contexto, em vez de cada um
// montar/desmontar o próprio modal. formId vem de useId() porque a mesma
// tela também existe como página cheia (/chamados/novo): um id fixo
// colidiria se as duas instâncias coexistissem.
export function NovoChamadoProvider({ children }: { children: ReactNode }) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [sujo, setSujo] = useState(false)
  // Remonta o form do zero na próxima abertura (key muda) — sem isso os
  // campos ficariam preenchidos da tentativa anterior.
  const [formKey, setFormKey] = useState(0)

  function fecharLimpando() {
    setSujo(false)
    setFormKey((key) => key + 1)
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next && sujo) {
      if (!window.confirm("Descartar as alterações?")) return
      fecharLimpando()
      return
    }
    setOpen(next)
  }

  return (
    <NovoChamadoContext.Provider value={{ abrir: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo chamado</DialogTitle>
            <DialogDescription>
              Abertura em nome do cliente. Prioridade e categoria de atendimento são definidas depois, no
              triage.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-4 min-h-0 overflow-y-auto px-4">
            <NovoChamadoForm key={formKey} formId={formId} onCriado={fecharLimpando} onSujoChange={setSujo} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" form={formId} className="cursor-pointer">
              Criar chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NovoChamadoContext.Provider>
  )
}
