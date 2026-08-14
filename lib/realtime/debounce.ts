export interface Agendador {
  agendar: (fn: () => void) => void
  cancelar: () => void
}

// Coalesce rajadas de eventos (ex.: N notificações do Realtime por uma ação
// em lote) numa única execução, `ms` depois do último `agendar()`. Só a
// função mais recente passada roda — as anteriores da mesma rajada são
// descartadas, então o caller deve passar sempre a versão atual do efeito
// (ex.: `() => router.refresh()`), não um fn preso a estado antigo.
export function criarAgendador(ms: number): Agendador {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  function cancelar() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  function agendar(fn: () => void) {
    cancelar()
    timeoutId = setTimeout(() => {
      timeoutId = undefined
      fn()
    }, ms)
  }

  return { agendar, cancelar }
}
