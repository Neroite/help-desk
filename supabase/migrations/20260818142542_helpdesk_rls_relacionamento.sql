alter table helpdesk.ticket_visualizacao enable row level security;
alter table helpdesk.ticket_contato enable row level security;
alter table helpdesk.mesa_trabalho enable row level security;
alter table helpdesk.setor enable row level security;

-- ticket_visualizacao e ticket_contato: só staff — quem visualizou e a
-- lista de contatos adicionais é informação interna, o solicitante não
-- precisa (nem deve) ver quem da equipe olhou o próprio chamado.
create policy ticket_visualizacao_staff_all on helpdesk.ticket_visualizacao for all
  using (helpdesk.is_staff()) with check (helpdesk.is_staff());

create policy ticket_contato_staff_all on helpdesk.ticket_contato for all
  using (helpdesk.is_staff()) with check (helpdesk.is_staff());

-- mesa_trabalho: catálogo global (como categoria_atendimento) — select
-- livre pra staff, escrita só admin.
create policy mesa_trabalho_select on helpdesk.mesa_trabalho for select
  using (true);
create policy mesa_trabalho_admin_write on helpdesk.mesa_trabalho for insert
  with check (helpdesk.is_admin());
create policy mesa_trabalho_admin_update on helpdesk.mesa_trabalho for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy mesa_trabalho_admin_delete on helpdesk.mesa_trabalho for delete
  using (helpdesk.is_admin());

-- setor: mesma regra de empresa_status (staff vê tudo; solicitante só o
-- setor da própria empresa); escrita só admin.
create policy setor_select on helpdesk.setor for select
  using (helpdesk.is_staff() or empresa_id = helpdesk.current_empresa_id() or empresa_id is null);
create policy setor_admin_write on helpdesk.setor for insert
  with check (helpdesk.is_admin());
create policy setor_admin_update on helpdesk.setor for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy setor_admin_delete on helpdesk.setor for delete
  using (helpdesk.is_admin());
