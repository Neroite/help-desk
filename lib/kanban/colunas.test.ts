import { describe, expect, it } from "vitest"

import type { Empresa, Ticket } from "@/lib/types"

import { colunasDoKanban, dropPermitido } from "./colunas"

function empresa(overrides: Partial<Empresa> = {}): Empresa {
  return {
    id: "empresa-1",
    nome: "ACME Ltda",
    cnpj: "00.000.000/0001-00",
    ativo: true,
    statusAtivos: ["a_fazer", "em_andamento", "finalizado"],
    statusRotulos: { a_fazer: "Fila", em_andamento: "Rolando" },
    ...overrides,
  }
}

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    numero: 1,
    titulo: "Chamado de teste",
    descricao: "",
    empresaId: "empresa-1",
    solicitanteId: "usuario-1",
    analistaId: null,
    statusKey: "a_fazer",
    prioridade: "media",
    catAtendimentoId: null,
    catProblemaId: null,
    criadoEm: new Date().toISOString(),
    primeiraRespostaEm: null,
    finalizadoEm: null,
    slaRespostaVenceEm: null,
    slaSolucaoVenceEm: null,
    slaPausadoEm: null,
    slaMinutosPausados: 0,
    ...overrides,
  }
}

describe("colunasDoKanban", () => {
  it("sem empresa, devolve as 6 colunas globais com rótulo padrão", () => {
    const colunas = colunasDoKanban(undefined)
    expect(colunas.map((c) => c.statusKey)).toEqual([
      "aguardando_aprovacao",
      "a_fazer",
      "em_andamento",
      "pausado",
      "finalizado",
      "cancelado",
    ])
    expect(colunas.find((c) => c.statusKey === "a_fazer")?.rotulo).toBe("A fazer")
  })

  it("com empresa, devolve só os status ativos dela", () => {
    const colunas = colunasDoKanban(empresa())
    expect(colunas.map((c) => c.statusKey)).toEqual(["a_fazer", "em_andamento", "finalizado"])
  })

  it("com empresa, usa o rótulo customizado quando existe, senão o padrão", () => {
    const colunas = colunasDoKanban(empresa())
    expect(colunas.find((c) => c.statusKey === "a_fazer")?.rotulo).toBe("Fila")
    expect(colunas.find((c) => c.statusKey === "finalizado")?.rotulo).toBe("Finalizado")
  })
})

describe("dropPermitido", () => {
  const colunas = colunasDoKanban(empresa())

  it("recusa soltar na mesma coluna em que o ticket já está", () => {
    expect(dropPermitido(ticket({ statusKey: "a_fazer" }), "a_fazer", colunas)).toBe(false)
  })

  it("recusa soltar num status fora das colunas visíveis", () => {
    expect(dropPermitido(ticket({ statusKey: "a_fazer" }), "pausado", colunas)).toBe(false)
  })

  it("permite soltar numa coluna diferente e visível", () => {
    expect(dropPermitido(ticket({ statusKey: "a_fazer" }), "em_andamento", colunas)).toBe(true)
  })
})
