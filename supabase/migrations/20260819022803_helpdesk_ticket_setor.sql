-- Setor de onde veio o chamado (empresa do cliente), não confundir com
-- usuario.setor_id (cadastro do usuário) -- editar um pela tela do outro
-- alteraria o cadastro global da pessoa em vez do chamado específico.
alter table helpdesk.ticket
  add column setor_id uuid references helpdesk.setor(id);
