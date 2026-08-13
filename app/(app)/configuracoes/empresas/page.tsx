import { listarEmpresas } from "@/lib/tickets/queries"

import { EmpresasClient } from "./empresas-client"

export default async function EmpresasPage() {
  const empresas = await listarEmpresas()
  return <EmpresasClient empresas={empresas} />
}
