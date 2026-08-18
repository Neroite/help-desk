import { describe, expect, it } from "vitest"

import type { Empresa, Ticket } from "@/lib/types"

import { aguardandoAnalista, colunasDoKanban } from "./colunas"

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
    ultimaInteracaoEm: null,
    ultimaInteracaoPapel: null,
    paiId: null,
    conciliadoNoId: null,
    mesaId: null,
    ...overrides,
  }
}

describe("colunasDoKanban", () => {
  it("sem empresa, devolve os status globais (exceto cancelado) + coluna derivada", () => {
    const colunas = colunasDoKanban(undefined)
    expect(colunas.map((c) => c.statusKey)).toEqual([
      "aguardando_aprovacao",
      "a_fazer",
      "em_andamento",
      "pausado",
      "finalizado",
      null,
    ])
    expect(colunas.at(-1)).toMatchObject({ tipo: "derivada", rotulo: "Última interação do cliente" })
    expect(colunas.find((c) => c.statusKey === "a_fazer")).toMatchObject({ tipo: "status", rotulo: "A fazer" })
  })

  it("com empresa, devolve só os status ativos dela + coluna derivada", () => {
    const colunas = colunasDoKanban(empresa())
    expect(colunas.map((c) => c.statusKey)).toEqual(["a_fazer", "em_andamento", "finalizado", null])
  })

  it("com empresa, usa o rótulo customizado quando existe, senão o padrão", () => {
    const colunas = colunasDoKanban(empresa())
    expect(colunas.find((c) => c.statusKey === "a_fazer")?.rotulo).toBe("Fila")
    expect(colunas.find((c) => c.statusKey === "finalizado")?.rotulo).toBe("Finalizado")
  })

  it("remove a coluna cancelado mesmo quando a empresa a usa", () => {
    const colunas = colunasDoKanban(empresa({ statusAtivos: ["a_fazer", "cancelado"] }))
    expect(colunas.map((c) => c.statusKey)).toEqual(["a_fazer", null])
  })
})

describe("aguardandoAnalista", () => {
  it("verdadeiro quando a última interação foi do solicitante e o chamado está aberto", () => {
    expect(
      aguardandoAnalista(ticket({ statusKey: "em_andamento", ultimaInteracaoPapel: "solicitante" }))
    ).toBe(true)
  })

  it("falso quando a última interação foi de um analista/admin", () => {
    expect(aguardandoAnalista(ticket({ statusKey: "em_andamento", ultimaInteracaoPapel: "analista" }))).toBe(
      false
    )
  })

  it("falso quando o chamado já está finalizado, mesmo com última interação do solicitante", () => {
    expect(
      aguardandoAnalista(ticket({ statusKey: "finalizado", ultimaInteracaoPapel: "solicitante" }))
    ).toBe(false)
  })

  it("falso quando não há nenhuma interação registrada", () => {
    expect(aguardandoAnalista(ticket({ statusKey: "em_andamento", ultimaInteracaoPapel: null }))).toBe(false)
  })
})
