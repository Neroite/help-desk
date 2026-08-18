import { STATUS_META } from "@/lib/status"
import { STATUS_FINAIS, STATUS_KEYS, type Empresa, type StatusKey, type Ticket } from "@/lib/types"

export type ColunaKanban =
  | { tipo: "status"; statusKey: StatusKey; rotulo: string }
  | { tipo: "derivada"; statusKey: null; rotulo: string }

const ROTULO_COLUNA_DERIVADA = "Última interação do cliente"

// "Cancelado" sai do quadro (raramente usado, e cancelar continua possível
// pelo menu do card / Select do detalhe) — no lugar entra uma coluna
// derivada, calculada, não persistida como status.
function statusVisiveis(empresa: Empresa | undefined): StatusKey[] {
  const base = empresa ? empresa.statusAtivos : STATUS_KEYS
  return base.filter((s) => s !== "cancelado")
}

// Sem empresa (fila global, sem filtro): status padrão (exceto cancelado) +
// coluna derivada. Com empresa selecionada: só os status que ela usa, com o
// rótulo customizado dela quando existe — mesma regra que já valia inline em
// chamados-client.tsx.
export function colunasDoKanban(empresa: Empresa | undefined): ColunaKanban[] {
  const colunasStatus: ColunaKanban[] = statusVisiveis(empresa).map((statusKey) => ({
    tipo: "status",
    statusKey,
    rotulo: empresa?.statusRotulos[statusKey] ?? STATUS_META[statusKey].rotuloPadrao,
  }))

  return [...colunasStatus, { tipo: "derivada", statusKey: null, rotulo: ROTULO_COLUNA_DERIVADA }]
}

// "Aguardando resposta do analista": chamado ainda aberto cuja última
// interação pública foi do solicitante. Deriva de `ultima_interacao_papel`
// (gravado por adicionarComentario), não recalcula a partir dos comentários
// no cliente.
export function aguardandoAnalista(ticket: Ticket): boolean {
  return ticket.ultimaInteracaoPapel === "solicitante" && !STATUS_FINAIS.includes(ticket.statusKey)
}
