import { notFound } from "next/navigation"

import {
  buscarAvaliacao,
  buscarChamadoPorNumero,
  listarAnexos,
  listarApontamentos,
  listarComentarios,
  listarEventos,
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

  const [comentarios, eventos, apontamentos, anexos, avaliacao] = await Promise.all([
    listarComentarios(numeroTicket),
    listarEventos(numeroTicket),
    listarApontamentos(numeroTicket),
    listarAnexos(numeroTicket),
    buscarAvaliacao(numeroTicket),
  ])

  return (
    <ChamadoDetalheClient
      ticket={ticket}
      comentarios={comentarios}
      eventos={eventos}
      apontamentos={apontamentos}
      anexos={anexos}
      avaliacao={avaliacao}
    />
  )
}
