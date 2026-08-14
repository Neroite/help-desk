import type { ReactNode } from "react"

import { ReferenceDataProvider } from "@/lib/reference-data/provider"
import {
  buscarUsuarioAtual,
  listarCategoriasAtendimento,
  listarCategoriasProblema,
  listarEmpresas,
  listarSlaPolicies,
  listarUsuarios,
} from "@/lib/tickets/queries"

import { PortalShell } from "./portal-shell"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const [empresas, usuarios, categoriasAtendimento, categoriasProblema, slaPolicies, usuarioAtual] =
    await Promise.all([
      listarEmpresas(),
      listarUsuarios(),
      listarCategoriasAtendimento(),
      listarCategoriasProblema(),
      listarSlaPolicies(),
      buscarUsuarioAtual(),
    ])

  return (
    <ReferenceDataProvider
      data={{ empresas, usuarios, categoriasAtendimento, categoriasProblema, slaPolicies, usuarioAtual }}
    >
      <PortalShell>{children}</PortalShell>
    </ReferenceDataProvider>
  )
}
