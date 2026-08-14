import { listarEmpresas, listarUsuarios } from "@/lib/tickets/queries"

import { UsuariosClient } from "./usuarios-client"

export default async function UsuariosPage() {
  const [usuarios, empresas] = await Promise.all([listarUsuarios(), listarEmpresas()])
  return <UsuariosClient usuarios={usuarios} empresas={empresas} />
}
