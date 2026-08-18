import { notFound } from "next/navigation"

import { registrarVisualizacao } from "@/lib/tickets/actions"
import { buscarTimerAberto } from "@/lib/tickets/apontamentos"
import {
  buscarAvaliacao,
  buscarChamadoPorNumero,
  buscarContatos,
  buscarVisualizacoes,
  listarAnexos,
  listarApontamentos,
  listarComentarios,
  listarEventos,
  listarTicketsFilho,
} from "@/lib/tickets/queries"

import { ChamadoDetalheClient } from "./chamado-detalhe-client"

interface ChamadoDetalhePageProps {
  params: Promise<{ numero: string }>
}

export default async function ChamadoDetalhePage({ params }: ChamadoDetalhePageProps) {
  const { numero } = await params
  const numeroTicket = Number(numero)

  const ticket = await buscarChamadoPorNumero(numeroTicket)
  if (!ticket) notFound()

  const [comentarios, eventos, apontamentos, anexos, avaliacao, timerAberto, filhos, contatos, visualizacoes] =
    await Promise.all([
      listarComentarios(numeroTicket),
      listarEventos(numeroTicket),
      listarApontamentos(numeroTicket),
      listarAnexos(numeroTicket),
      buscarAvaliacao(numeroTicket),
      buscarTimerAberto(),
      listarTicketsFilho(numeroTicket),
      buscarContatos(numeroTicket),
      buscarVisualizacoes(numeroTicket),
    ])

  // Awaited (não "fire and forget"): em runtime serverless a resposta pode
  // ser encerrada antes de uma promise solta terminar, perdendo o upsert.
  await registrarVisualizacao(numeroTicket)

  return (
    <ChamadoDetalheClient
      ticket={ticket}
      comentarios={comentarios}
      eventos={eventos}
      apontamentos={apontamentos}
      anexos={anexos}
      avaliacao={avaliacao}
      timerAberto={timerAberto}
      filhos={filhos}
      contatos={contatos}
      visualizacoes={visualizacoes}
    />
  )
}
