alter table helpdesk.ticket
  add column pai_id bigint references helpdesk.ticket(numero),
  add column conciliado_no_id bigint references helpdesk.ticket(numero);

create index ticket_pai_id_idx on helpdesk.ticket(pai_id);
create index ticket_conciliado_no_id_idx on helpdesk.ticket(conciliado_no_id);

comment on column helpdesk.ticket.pai_id is 'Chamado pai — este ticket é um filho criado para dividir o trabalho por setor.';
comment on column helpdesk.ticket.conciliado_no_id is 'Quando preenchido, este ticket foi conciliado (marcado como duplicado) e anexado ao ticket principal indicado.';
