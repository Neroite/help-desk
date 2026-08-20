import { describe, expect, it } from "vitest"

import { chamadosParaCsv, type ContextoCsv } from "@/lib/relatorios/csv"
import type { Ticket } from "@/lib/types"

function ticketBase(overrides: Partial<Ticket> = {}): Ticket {
  return {
    numero: 1,
    titulo: "Chamado de teste",
    descricao: "",
    empresaId: "empresa-1",
    solicitanteId: "solicitante-1",
    analistaId: null,
    statusKey: "a_fazer",
    prioridade: null,
    catAtendimentoId: null,
    catProblemaId: null,
    criadoEm: "2026-08-18T12:00:00.000Z",
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
    setorId: null,
    ...overrides,
  }
}

const contexto: ContextoCsv = {
  nomeEmpresa: (id) => (id === "empresa-1" ? "ACME Ltda" : "?"),
  nomeUsuario: (id) => (id === "solicitante-1" ? "Maria Souza" : id ? "Analista" : "Não atribuído"),
}

describe("chamadosParaCsv", () => {
  it("gera cabeçalho e uma linha por chamado", () => {
    const csv = chamadosParaCsv([ticketBase()], contexto)
    const linhas = csv.split("\r\n")
    expect(linhas[0]).toBe(
      "Numero,Titulo,Empresa,Solicitante,Analista,Status,Prioridade,Criado em,Finalizado em"
    )
    expect(linhas[1]).toBe(
      "1,Chamado de teste,ACME Ltda,Maria Souza,Não atribuído,A fazer,Sem prioridade,2026-08-18T12:00:00.000Z,"
    )
  })

  it("escapa título com vírgula e aspas", () => {
    const csv = chamadosParaCsv(
      [ticketBase({ titulo: 'Impressora "HP" não liga, sem energia' })],
      contexto
    )
    expect(csv).toContain('"Impressora ""HP"" não liga, sem energia"')
  })

  it("prioridade e status usam o rótulo, não a chave interna", () => {
    const csv = chamadosParaCsv([ticketBase({ prioridade: "alta", statusKey: "em_andamento" })], contexto)
    expect(csv).toContain("Em andamento")
    expect(csv).toContain("Alta")
  })

  it("lista vazia gera só o cabeçalho", () => {
    const csv = chamadosParaCsv([], contexto)
    expect(csv.split("\r\n")).toHaveLength(1)
  })
})
