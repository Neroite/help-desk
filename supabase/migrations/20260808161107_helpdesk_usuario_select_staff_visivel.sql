drop policy usuario_select on helpdesk.usuario;

create policy usuario_select on helpdesk.usuario for select
  using (id = auth.uid() or helpdesk.is_staff() or papel in ('admin', 'analista'));
