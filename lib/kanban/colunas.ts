import { STATUS_META } from "@/lib/status"
import { STATUS_KEYS, type Empresa, type StatusKey, type Ticket } from "@/lib/types"

export interface ColunaKanban {
  statusKey: StatusKey
  rotulo: string
}

// Sem empresa (fila global, sem filtro): as 6 colunas padrão. Com empresa
// selecionada: só os status que ela usa, com o rótulo customizado dela
// quando existe — mesma regra que já valia inline em chamados-client.tsx.
export function colunasDoKanban(empresa: Empresa | undefined): ColunaKanban[] {
  if (!empresa) {
    return STATUS_KEYS.map((statusKey) => ({
      statusKey,
      rotulo: STATUS_META[statusKey].rotuloPadrao,
    }))
  }

  return empresa.statusAtivos.map((statusKey) => ({
    statusKey,
    rotulo: empresa.statusRotulos[statusKey] ?? STATUS_META[statusKey].rotuloPadrao,
  }))
}

// Não permite soltar no mesmo status em que o ticket já está, nem num
// status fora das colunas visíveis (ex.: empresa não usa esse status).
export function dropPermitido(ticket: Ticket, destino: StatusKey, colunas: ColunaKanban[]): boolean {
  if (destino === ticket.statusKey) return false
  return colunas.some((c) => c.statusKey === destino)
}
