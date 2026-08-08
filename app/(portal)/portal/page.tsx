import Link from "next/link"
import { Plus, Inbox } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TicketCard } from "@/components/chamado/ticket-card"
import { listarChamados } from "@/lib/tickets/queries"

// RLS já escopa por empresa (ver helpdesk.ticket_select) — o solicitante
// só recebe os chamados da própria empresa, não precisa filtrar aqui.
export default async function PortalPage() {
  const meusChamados = await listarChamados()

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-(--space-3)">
        <h1 className="text-2xl font-semibold text-foreground">Meus chamados</h1>
        <Button render={<Link href="/portal/novo" />} nativeButton={false} className="cursor-pointer">
          <Plus className="size-4" data-icon="inline-start" />
          Abrir chamado
        </Button>
      </div>

      {meusChamados.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-(--space-3) rounded-md border border-dashed border-border py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Você ainda não abriu nenhum chamado
          </p>
          <Button render={<Link href="/portal/novo" />} nativeButton={false} className="cursor-pointer">
            <Plus className="size-4" data-icon="inline-start" />
            Abrir chamado
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-(--space-3) sm:grid-cols-2 lg:grid-cols-3">
          {meusChamados.map((ticket) => (
            <TicketCard key={ticket.numero} ticket={ticket} href={`/portal/chamados/${ticket.numero}`} />
          ))}
        </div>
      )}
    </div>
  )
}
