-- O link de avaliação vai por e-mail e é aberto SEM login. Usar o `numero`
-- do chamado como identificador do link deixaria qualquer pessoa enumerar
-- chamados finalizados de qualquer empresa (a sequência é previsível).
-- O token é opaco, aleatório e único por chamado.
alter table helpdesk.ticket
  add column token_avaliacao uuid not null default gen_random_uuid();

alter table helpdesk.ticket
  add constraint ticket_token_avaliacao_unico unique (token_avaliacao);
