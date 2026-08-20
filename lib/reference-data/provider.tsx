"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type {
  CategoriaAtendimento,
  CategoriaProblema,
  Empresa,
  MesaTrabalho,
  Setor,
  SlaPolicy,
  Usuario,
} from "@/lib/types"

export interface ReferenceData {
  empresas: Empresa[]
  usuarios: Usuario[]
  categoriasAtendimento: CategoriaAtendimento[]
  categoriasProblema: CategoriaProblema[]
  slaPolicies: SlaPolicy[]
  mesasTrabalho: MesaTrabalho[]
  setores: Setor[]
  usuarioAtual: Usuario | null
}

interface ReferenceDataApi extends ReferenceData {
  empresaPorId: (id: string | null | undefined) => Empresa | undefined
  usuarioPorId: (id: string | null | undefined) => Usuario | undefined
  mesaPorId: (id: string | null | undefined) => MesaTrabalho | undefined
  setorPorId: (id: string | null | undefined) => Setor | undefined
}

const ReferenceDataContext = createContext<ReferenceDataApi | null>(null)

// Dado de referência (empresas, usuários, categorias) buscado uma vez no
// servidor por cada shell — (app)/layout.tsx e (portal)/layout.tsx — e
// distribuído por Context em vez de prop-drilling por toda a árvore de
// componentes de chamado. IDs são UUID real do Supabase, não os ids mock
// tipo "u-joao" — por isso essa camada substitui lib/mock/data.ts nas
// telas já religadas ao backend.
export function ReferenceDataProvider({
  data,
  children,
}: {
  data: ReferenceData
  children: ReactNode
}) {
  const value = useMemo<ReferenceDataApi>(() => {
    const empresasPorId = new Map(data.empresas.map((e) => [e.id, e]))
    const usuariosPorId = new Map(data.usuarios.map((u) => [u.id, u]))
    const mesasPorId = new Map(data.mesasTrabalho.map((m) => [m.id, m]))
    const setoresPorId = new Map(data.setores.map((s) => [s.id, s]))
    return {
      ...data,
      empresaPorId: (id) => (id ? empresasPorId.get(id) : undefined),
      usuarioPorId: (id) => (id ? usuariosPorId.get(id) : undefined),
      mesaPorId: (id) => (id ? mesasPorId.get(id) : undefined),
      setorPorId: (id) => (id ? setoresPorId.get(id) : undefined),
    }
  }, [data])

  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>
}

export function useReferenceData(): ReferenceDataApi {
  const ctx = useContext(ReferenceDataContext)
  if (!ctx) throw new Error("useReferenceData precisa estar dentro de ReferenceDataProvider")
  return ctx
}
