"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { criarAgendador } from "@/lib/realtime/debounce"
import { createClient } from "@/lib/supabase/client"

// Espera para coalescer rajadas de eventos (ex.: BulkActionBar mudando N
// chamados de uma vez dispara N eventos) numa única `router.refresh()`.
const DEBOUNCE_MS = 400

export interface AssinaturaRealtime {
  tabela: "ticket" | "comentario" | "ticket_evento"
}

// O evento do Postgres é só o SINAL — nunca a fonte do dado, e nunca é lido.
// Quem recarrega é o Server Component da própria rota, refazendo as queries
// de lib/tickets/queries.ts (que já respeitam RLS e já fazem o mapeamento
// snake_case -> camelCase). Isso garante que uma nota interna nunca vaze
// pro portal só porque um evento chegou até lá.
//
// Sem filtro por linha: tentamos o parâmetro `filter` nativo do Realtime
// (schema.table + `numero=eq.<n>`) e, quando isso falhava em silêncio,
// tentamos filtrar no cliente lendo `payload.new`/`payload.old`. As duas
// abordagens quebraram do mesmo jeito nesta base: o Realtime devolveu
// `errors: ["Error 401: Unauthorized"]` com `new`/`old` vazios sempre que a
// checagem de RLS por linha passava pelas nossas funções `helpdesk.is_staff()`
// / `current_empresa_id()` (que dependem de `auth.uid()`) — aparentemente
// `auth.uid()` não é propagado do mesmo jeito na conexão interna de
// autorização do Realtime como é numa requisição normal via PostgREST.
// Assinar sem filtro contorna o problema (o Realtime não precisa avaliar
// nenhuma coluna pra saber "a tabela mudou") e ainda é seguro: o refresh só
// dispara a query real do servidor, que aplica a RLS de verdade. O custo é
// recarregar a tela em mudanças de tickets que não são os que o usuário está
// vendo — aceitável na escala deste app.
export function useRealtimeRefresh(assinaturas: AssinaturaRealtime[]) {
  const router = useRouter()
  const chave = JSON.stringify(assinaturas)

  useEffect(() => {
    const lista = JSON.parse(chave) as AssinaturaRealtime[]
    if (lista.length === 0) return

    const supabase = createClient()
    const agendador = criarAgendador(DEBOUNCE_MS)
    const canal = supabase.channel(`refresh:${chave}`)

    for (const { tabela } of lista) {
      canal.on(
        "postgres_changes",
        { event: "*", schema: "helpdesk", table: tabela },
        () => agendador.agendar(() => router.refresh())
      )
    }
    canal.subscribe()

    return () => {
      agendador.cancelar()
      supabase.removeChannel(canal)
    }
  }, [chave, router])
}
