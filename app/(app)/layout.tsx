import type { ReactNode } from "react"

import { ReferenceDataProvider } from "@/lib/reference-data/provider"
import {
  buscarUsuarioAtual,
  listarCategoriasAtendimento,
  listarCategoriasProblema,
  listarEmpresas,
  listarMesasTrabalho,
  listarSetores,
  listarSlaPolicies,
  listarUsuarios,
} from "@/lib/tickets/queries"

import { AppShell } from "./app-shell"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [
    empresas,
    usuarios,
    categoriasAtendimento,
    categoriasProblema,
    slaPolicies,
    mesasTrabalho,
    setores,
    usuarioAtual,
  ] = await Promise.all([
    listarEmpresas(),
    listarUsuarios(),
    listarCategoriasAtendimento(),
    listarCategoriasProblema(),
    listarSlaPolicies(),
    listarMesasTrabalho(),
    listarSetores(),
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
        setores,
        usuarioAtual,
      }}
    >
      <AppShell>{children}</AppShell>
    </ReferenceDataProvider>
  )
}
