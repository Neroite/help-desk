"use client"

import { useId, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { NovoChamadoForm } from "@/components/chamado/novo-chamado-form"
import { Button } from "@/components/ui/button"

// Casca de página em volta de NovoChamadoForm — o mesmo form também vive
// dentro do modal disparado pelo "+ Ticket" (NovoChamadoDialog). Header,
// confirmação de descarte e navegação de volta são específicos de página;
// o form em si (campos, validação, submit) é compartilhado.
export default function NovoChamadoPage() {
  const router = useRouter()
  const formId = useId()
  const [sujo, setSujo] = useState(false)

  function handleCancelar(event: MouseEvent<HTMLAnchorElement>) {
    if (sujo && !window.confirm("Descartar as alterações?")) {
      event.preventDefault()
    }
  }

  function handleCriado(numero: number) {
    toast.success("Chamado criado com sucesso.")
    router.push(`/chamados/${numero}`)
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/chamados" aria-label="Voltar para chamados" onClick={handleCancelar} />}
          nativeButton={false}
          className="cursor-pointer"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Novo chamado</h1>
      </div>
      <p className="max-w-4xl text-sm text-muted-foreground">
        Abertura em nome do cliente. Prioridade e categoria de atendimento são definidas depois, no triage.
      </p>

      <div className="flex max-w-4xl flex-col gap-(--space-4)">
        <NovoChamadoForm formId={formId} onCriado={handleCriado} onSujoChange={setSujo} />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            render={<Link href="/chamados" onClick={handleCancelar} />}
            nativeButton={false}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="cursor-pointer">
            Criar chamado
          </Button>
        </div>
      </div>
    </div>
  )
}
