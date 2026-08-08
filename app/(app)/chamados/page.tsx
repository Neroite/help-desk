import { listarChamados } from "@/lib/tickets/queries"

import { ChamadosClient } from "./chamados-client"

export default async function ChamadosPage() {
  const tickets = await listarChamados()
  return <ChamadosClient tickets={tickets} />
}
