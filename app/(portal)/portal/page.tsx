import Link from "next/link"
import { Plus, Inbox, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TicketCard } from "@/components/chamado/ticket-card"
import { listarChamados } from "@/lib/tickets/queries"

import { PortalRealtime } from "./portal-realtime"

// RLS já escopa por empresa (ver helpdesk.ticket_select) — o solicitante
// só recebe os chamados da própria empresa, não precisa filtrar aqui.
export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { busca } = await searchParams
  const meusChamados = await listarChamados(busca ? { busca } : {})
  const buscaAtiva = Boolean(busca)

  return (
    <div className="flex flex-col gap-(--space-4)">
      <PortalRealtime />
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="flex items-center gap-(--space-3)">
          <h1 className="text-2xl font-semibold text-foreground">Meus chamados</h1>
          {buscaAtiva && (
            <Link
              href="/portal"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Limpar busca
            </Link>
          )}
        </div>
        <Button render={<Link href="/portal/novo" />} nativeButton={false} className="cursor-pointer">
          <Plus className="size-4" data-icon="inline-start" />
          Abrir chamado
        </Button>
      </div>

      {meusChamados.length === 0 ? (
        buscaAtiva ? (
          <div className="flex flex-col items-center justify-center gap-(--space-3) rounded-md border border-dashed border-border py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Nenhum chamado encontrado para &ldquo;{busca}&rdquo;.
            </p>
            <Link
              href="/portal"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Limpar busca
            </Link>
          </div>
        ) : (
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
        )
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
