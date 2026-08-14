import type { Papel } from "@/lib/types"

export function redirectPorPapel(papel: Papel): string {
  return papel === "solicitante" ? "/portal" : "/chamados?view=kanban"
}
