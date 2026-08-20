-- Marca de onde veio um comentário: 'usuario' (padrão, escrito por alguém) ou
-- 'descricao' (gerado pela migration seguinte a partir de ticket.descricao).
-- Eixo diferente de `formato` (como renderizar) -- ver 20260819113657.
alter table helpdesk.comentario
  add column origem text not null default 'usuario'
    check (origem in ('usuario', 'descricao'));
