import { SearchX } from "lucide-react"

import { buscarChamadoPorToken } from "./actions"
import { AvaliarClient } from "./avaliar-client"

interface PageProps {
  params: Promise<{ token: string }>
}

// Rota pública standalone (sem sidebar/topbar), acessada por link de e-mail —
// não exige login. O `token` é o `ticket.token_avaliacao`: opaco e aleatório,
// justamente para o link não permitir enumerar chamados pelo número.
export default async function AvaliarPage({ params }: PageProps) {
  const { token } = await params
  const chamado = await buscarChamadoPorToken(token)

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-(--space-4)">
      <div className="flex w-full max-w-md flex-col items-center gap-(--space-4) rounded-md border border-border bg-surface p-(--space-6) text-center shadow-sm">
        {!chamado ? (
          <>
            <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-foreground">Link inválido</h1>
            <p className="text-sm text-muted-foreground">
              Não encontramos um chamado finalizado associado a este link de avaliação.
            </p>
          </>
        ) : (
          <AvaliarClient token={token} chamado={chamado} />
        )}
      </div>
    </div>
  )
}
