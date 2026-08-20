-- Distingue anexo colado/arrastado dentro do editor de comentário (inline =
-- true, referenciado por <img src="/api/anexos/<id>"> no corpo html) de
-- anexo de verdade da lista "Anexos" do chamado. Sem isso, toda imagem colada
-- no editor apareceria duplicada na lista de anexos.
alter table helpdesk.anexo
  add column inline boolean not null default false;
