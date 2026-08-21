-- 1. anexo_staff_update (UPDATE) tinha USING mas não WITH CHECK — padroniza
--    com as demais policies de update do schema.
alter policy anexo_staff_update on helpdesk.anexo
  with check (helpdesk.is_staff());

-- 2. apontamento_horas: separa leitura/criação (qualquer staff) de
--    edição/exclusão (só o dono do apontamento ou admin) — a checagem de
--    "timer é de outro analista" existia só em lib/tickets/apontamentos.ts,
--    contornável via REST API direta.
drop policy apontamento_horas_staff_all on helpdesk.apontamento_horas;

create policy apontamento_horas_select on helpdesk.apontamento_horas for select
  using (helpdesk.is_staff());
create policy apontamento_horas_insert on helpdesk.apontamento_horas for insert
  with check (helpdesk.is_staff());
create policy apontamento_horas_update on helpdesk.apontamento_horas for update
  using (analista_id = auth.uid() or helpdesk.is_admin())
  with check (analista_id = auth.uid() or helpdesk.is_admin());
create policy apontamento_horas_delete on helpdesk.apontamento_horas for delete
  using (analista_id = auth.uid() or helpdesk.is_admin());

-- 3. avaliacao_insert: fluxo autenticado direto não exigia chamado
--    finalizado, diferente do fluxo por token (avaliar_por_token). Alinha
--    as duas regras.
drop policy avaliacao_insert on helpdesk.avaliacao;

create policy avaliacao_insert on helpdesk.avaliacao for insert
  with check (
    exists (
      select 1 from helpdesk.ticket t
      where t.numero = avaliacao.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
        and t.status_key = 'finalizado'
    )
  );

-- 4. usuario_select liberava a linha inteira (inclusive email) de todo
--    admin/analista pra qualquer autenticado. Restringe a self/staff e
--    cria diretório público (sem email) pro portal do solicitante listar
--    nome/papel de quem atende.
drop policy usuario_select on helpdesk.usuario;

create policy usuario_select on helpdesk.usuario for select
  using (id = auth.uid() or helpdesk.is_staff());

create or replace function helpdesk.usuario_diretorio()
returns table (id uuid, nome text, papel helpdesk.papel, empresa_id uuid, setor_id uuid)
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select id, nome, papel, empresa_id, setor_id
  from helpdesk.usuario
  where papel in ('admin', 'analista')
$$;

revoke all on function helpdesk.usuario_diretorio() from public;
grant execute on function helpdesk.usuario_diretorio() to authenticated;
