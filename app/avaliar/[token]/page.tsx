"use client"

import { use, useState } from "react"
import { CheckCircle2, SearchX } from "lucide-react"

import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ticketPorNumero } from "@/lib/mock/data"

interface PageProps {
  params: Promise<{ token: string }>
}

// Rota pública standalone (sem sidebar/topbar), acessada por link de
// e-mail — não exige login. Para efeito de mock, `token` é tratado como
// o número do chamado. Usamos o hook `use()` (em vez de await) porque a
// página precisa ser client component para o fluxo interativo de
// estrelas + confirmação, e params ainda chega como Promise no Next 15.
//
// AINDA NÃO RELIGADA ao Supabase de propósito: abrir RLS pública pro
// ticket/avaliacao usando `numero` sequencial como "token" deixaria
// qualquer pessoa listar chamados finalizados de qualquer empresa
// (numero é previsível/incremental). Token de verdade, opaco e
// vinculado ao envio do e-mail, é escopo da Fase 7 (e-mail
// transacional) — até lá esta tela continua sobre lib/mock/data.
export default function AvaliarPage({ params }: PageProps) {
  const { token } = use(params)
  const numero = Number(token)
  const ticket = ticketPorNumero(numero)

  const [estrelas, setEstrelas] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviado, setEnviado] = useState(false)

  function enviarAvaliacao() {
    if (estrelas === 0) return
    // Mock — sem backend ainda, só troca o estado local pra tela de agradecimento.
    setEnviado(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-(--space-4)">
      <div className="flex w-full max-w-md flex-col items-center gap-(--space-4) rounded-md border border-border bg-surface p-(--space-6) text-center shadow-sm">
        {!ticket ? (
          <>
            <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-foreground">Link inválido</h1>
            <p className="text-sm text-muted-foreground">
              Não encontramos o chamado associado a este link de avaliação.
            </p>
          </>
        ) : enviado ? (
          <>
            {/* Verde semântico de sucesso — não text-status-finalizado, que agora é preto */}
            <CheckCircle2 className="size-10 text-sla-ok" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Obrigado pela avaliação!</h1>
            <p className="text-sm text-muted-foreground">
              Sua opinião ajuda nossa equipe a melhorar o atendimento.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              Como foi o atendimento do chamado #{ticket.numero}?
            </h1>
            <p className="text-sm text-muted-foreground">{ticket.titulo}</p>
            <AvaliacaoEstrelas valor={estrelas} onChange={setEstrelas} className="justify-center" />
            <Textarea
              placeholder="Conte como foi sua experiência (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="text-left"
            />
            <Button
              className="w-full cursor-pointer"
              onClick={enviarAvaliacao}
              disabled={estrelas === 0}
            >
              Enviar avaliação
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
