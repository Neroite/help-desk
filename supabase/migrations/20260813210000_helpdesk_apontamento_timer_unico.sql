-- Um analista só pode ter um timer rodando por vez, em qualquer chamado.
-- A trava vive no banco (e não só na action) porque dois cliques rápidos,
-- duas abas ou duas sessões conseguiriam abrir dois timers concorrentes e
-- dobrar as horas faturadas.
create unique index apontamento_horas_timer_aberto_unico_idx
  on helpdesk.apontamento_horas (analista_id) where (fim is null);
