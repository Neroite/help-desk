"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { avaliarPorToken, type ChamadoParaAvaliar } from "./actions"

interface AvaliarClientProps {
  token: string
  chamado: ChamadoParaAvaliar
}

export function AvaliarClient({ token, chamado }: AvaliarClientProps) {
  // Chamado já avaliado cai direto na tela de agradecimento: reenviar o
  // formulário não muda a nota (a RPC faz `on conflict do nothing`), então
  // oferecer o formulário de novo só enganaria quem clicou no link duas vezes.
  const [enviado, setEnviado] = useState(chamado.jaAvaliado)
  const [estrelas, setEstrelas] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function enviarAvaliacao() {
    if (estrelas === 0) return

    setEnviando(true)
    try {
      await avaliarPorToken(token, estrelas, comentario)
      setEnviado(true)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível enviar a avaliação."
      )
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <>
        {/* Verde semântico de sucesso — não text-status-finalizado, que agora é preto */}
        <CheckCircle2 className="size-10 text-sla-ok" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">Obrigado pela avaliação!</h1>
        <p className="text-sm text-muted-foreground">
          Sua opinião ajuda nossa equipe a melhorar o atendimento.
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">
        Como foi o atendimento do chamado #{chamado.numero}?
      </h1>
      <p className="text-sm text-muted-foreground">{chamado.titulo}</p>
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
        disabled={estrelas === 0 || enviando}
      >
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </>
  )
}
