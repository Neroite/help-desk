import type { ReactNode } from "react"

import { ReferenceDataProvider } from "@/lib/reference-data/provider"
import {
  buscarUsuarioAtual,
  listarCategoriasAtendimento,
  listarCategoriasProblema,
  listarEmpresas,
  listarMesasTrabalho,
  listarSlaPolicies,
  listarUsuarios,
} from "@/lib/tickets/queries"

import { PortalShell } from "./portal-shell"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const [
    empresas,
    usuarios,
    categoriasAtendimento,
    categoriasProblema,
    slaPolicies,
    mesasTrabalho,
    usuarioAtual,
  ] = await Promise.all([
    listarEmpresas(),
    listarUsuarios(),
    listarCategoriasAtendimento(),
    listarCategoriasProblema(),
    listarSlaPolicies(),
    listarMesasTrabalho(),
    buscarUsuarioAtual(),
  ])

  return (
    <ReferenceDataProvider
      data={{
        empresas,
        usuarios,
        categoriasAtendimento,
        categoriasProblema,
        slaPolicies,
        mesasTrabalho,
        // Setor do solicitante é edição exclusiva do painel do staff -- o
        // portal não usa, então não vale gastar a query aqui.
        setores: [],
        usuarioAtual,
      }}
    >
      <PortalShell>{children}</PortalShell>
    </ReferenceDataProvider>
  )
}
