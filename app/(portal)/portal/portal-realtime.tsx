"use client"

import { useRealtimeRefresh } from "@/lib/realtime/use-realtime-refresh"

// PortalPage é Server Component (busca `meusChamados` direto via query) e
// não tem nenhum client component próprio pra pendurar o hook — este
// componente existe só pra isso, não renderiza nada. RLS de `ticket_select`
// já escopa por empresa, então o evento cru nunca revela chamado alheio.
export function PortalRealtime() {
  useRealtimeRefresh([{ tabela: "ticket" }])
  return null
}
