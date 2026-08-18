create table helpdesk.ticket_contato (
  ticket_id bigint not null references helpdesk.ticket(numero) on delete cascade,
  usuario_id uuid not null references helpdesk.usuario(id) on delete cascade,
  criado_em timestamptz not null default now(),
  adicionado_por uuid references helpdesk.usuario(id),
  primary key (ticket_id, usuario_id)
);

comment on table helpdesk.ticket_contato is 'Contatos adicionais acompanhando um ticket, além de quem abriu (ticket.solicitante_id).';
