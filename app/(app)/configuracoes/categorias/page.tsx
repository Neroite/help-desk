import { listarCategoriasAtendimento, listarCategoriasProblema } from "@/lib/tickets/queries"

import { CategoriasClient } from "./categorias-client"

export default async function CategoriasPage() {
  const [categoriasAtendimento, categoriasProblema] = await Promise.all([
    listarCategoriasAtendimento(),
    listarCategoriasProblema(),
  ])

  return (
    <CategoriasClient
      categoriasAtendimento={categoriasAtendimento}
      categoriasProblema={categoriasProblema}
    />
  )
}
