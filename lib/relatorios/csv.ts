import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import type { Ticket } from "@/lib/types"

function escapeCsv(valor: string): string {
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

export interface ContextoCsv {
  nomeEmpresa: (id: string) => string
  nomeUsuario: (id: string | null) => string
}

const CABECALHO = [
  "Numero",
  "Titulo",
  "Empresa",
  "Solicitante",
  "Analista",
  "Status",
  "Prioridade",
  "Criado em",
  "Finalizado em",
]

/**
 * CSV com quebra de linha `\r\n` (compatibilidade Excel/Windows). Sem BOM
 * aqui de propósito -- é responsabilidade de quem grava o arquivo/Blob
 * prefixar `﻿`, não deste módulo puro e testável.
 */
export function chamadosParaCsv(tickets: Ticket[], contexto: ContextoCsv): string {
  const linhas = tickets.map((t) =>
    [
      String(t.numero),
      t.titulo,
      contexto.nomeEmpresa(t.empresaId),
      contexto.nomeUsuario(t.solicitanteId),
      contexto.nomeUsuario(t.analistaId),
      STATUS_META[t.statusKey].rotuloPadrao,
      t.prioridade ? PRIORIDADE_META[t.prioridade].rotulo : "Sem prioridade",
      t.criadoEm,
      t.finalizadoEm ?? "",
    ]
      .map(escapeCsv)
      .join(",")
  )

  return [CABECALHO.join(","), ...linhas].join("\r\n")
}
