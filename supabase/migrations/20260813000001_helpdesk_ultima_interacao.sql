alter table helpdesk.ticket
  add column ultima_interacao_em timestamptz,
  add column ultima_interacao_papel helpdesk.papel;

-- backfill a partir do último comentário público de cada chamado
update helpdesk.ticket t set
  ultima_interacao_em = c.criado_em,
  ultima_interacao_papel = u.papel
from ( select distinct on (ticket_id) ticket_id, autor_id, criado_em
       from helpdesk.comentario where interno = false
       order by ticket_id, criado_em desc ) c
join helpdesk.usuario u on u.id = c.autor_id
where t.numero = c.ticket_id;

create index ticket_ultima_interacao_idx
  on helpdesk.ticket (ultima_interacao_papel, status_key);
