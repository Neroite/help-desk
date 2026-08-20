-- Migration retroativa e idempotente: transforma a descrição de cada chamado
-- existente no seu primeiro comentário público, autorado pelo solicitante.
-- Idempotência via origem = 'descricao' (não por igualdade de texto -- um
-- comentário legítimo idêntico à descrição não deve ser pulado). Verificado:
-- helpdesk.comentario não tem trigger (o único trigger do schema é
-- categoria_problema_profundidade), então este insert não dispara
-- primeira_resposta_em nem mexe em SLA -- esses campos só são tocados em
-- código de aplicação, e o autor aqui é sempre o solicitante.
insert into helpdesk.comentario (ticket_id, autor_id, corpo, interno, criado_em, origem)
select t.numero, t.solicitante_id, t.descricao, false, t.criado_em, 'descricao'
from helpdesk.ticket t
where coalesce(btrim(t.descricao), '') <> ''
  and not exists (
    select 1 from helpdesk.comentario c
    where c.ticket_id = t.numero and c.origem = 'descricao'
  );

-- Só preenche a última interação quando ainda não há nenhuma -- sobrescrever
-- quebraria tickets que já têm interação posterior à abertura.
update helpdesk.ticket t
set ultima_interacao_em = c.criado_em,
    ultima_interacao_papel = 'solicitante'
from helpdesk.comentario c
where c.ticket_id = t.numero
  and c.origem = 'descricao'
  and t.ultima_interacao_em is null;
