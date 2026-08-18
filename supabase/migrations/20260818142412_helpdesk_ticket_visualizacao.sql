create table helpdesk.ticket_visualizacao (
  ticket_id bigint not null references helpdesk.ticket(numero) on delete cascade,
  usuario_id uuid not null references helpdesk.usuario(id) on delete cascade,
  visto_em timestamptz not null default now(),
  primary key (ticket_id, usuario_id)
);

comment on table helpdesk.ticket_visualizacao is 'Última vez que cada usuário staff visualizou o detalhe de um ticket — upsert por (ticket_id, usuario_id), não um log de todas as visualizações.';
