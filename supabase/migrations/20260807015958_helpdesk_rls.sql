-- Expor o schema helpdesk pro PostgREST (client Supabase só enxerga
-- schemas nessa lista; por padrão é só "public"). Convive com o que
-- já está exposto pro byteflow-pro.
alter role authenticator set pgrst.db_schemas = 'public, helpdesk';
notify pgrst, 'reload config';

grant usage on schema helpdesk to authenticated, anon;
grant select, insert, update, delete on all tables in schema helpdesk to authenticated;
alter default privileges in schema helpdesk
  grant select, insert, update, delete on tables to authenticated;

-- security definer + search_path fixo: bypassa RLS de helpdesk.usuario (o
-- dono da função é o owner da tabela) sem abrir recursão de policy nem
-- risco de search_path injection.
create function helpdesk.current_papel()
returns helpdesk.papel
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select papel from helpdesk.usuario where id = auth.uid()
$$;

create function helpdesk.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select empresa_id from helpdesk.usuario where id = auth.uid()
$$;

create function helpdesk.is_staff()
returns boolean
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select helpdesk.current_papel() in ('admin', 'analista')
$$;

create function helpdesk.is_admin()
returns boolean
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select helpdesk.current_papel() = 'admin'
$$;

alter table helpdesk.empresa enable row level security;
alter table helpdesk.usuario enable row level security;
alter table helpdesk.empresa_status enable row level security;
alter table helpdesk.sla_policy enable row level security;
alter table helpdesk.categoria_atendimento enable row level security;
alter table helpdesk.categoria_problema enable row level security;
alter table helpdesk.ticket enable row level security;
alter table helpdesk.comentario enable row level security;
alter table helpdesk.apontamento_horas enable row level security;
alter table helpdesk.anexo enable row level security;
alter table helpdesk.avaliacao enable row level security;
alter table helpdesk.ticket_evento enable row level security;

-- usuario: cada um lê a própria linha; staff lê todo mundo; só admin escreve.
create policy usuario_select on helpdesk.usuario for select
  using (id = auth.uid() or helpdesk.is_staff());
create policy usuario_admin_all on helpdesk.usuario for all
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());

-- empresa: solicitante só a própria; staff todas; só admin escreve.
create policy empresa_select on helpdesk.empresa for select
  using (helpdesk.is_staff() or id = helpdesk.current_empresa_id());
create policy empresa_admin_write on helpdesk.empresa for insert
  with check (helpdesk.is_admin());
create policy empresa_admin_update on helpdesk.empresa for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy empresa_admin_delete on helpdesk.empresa for delete
  using (helpdesk.is_admin());

create policy empresa_status_select on helpdesk.empresa_status for select
  using (helpdesk.is_staff() or empresa_id = helpdesk.current_empresa_id());
create policy empresa_status_admin_all on helpdesk.empresa_status for all
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());

-- sla_policy e categorias: dado de referência do staff (triage); admin edita.
create policy sla_policy_staff_select on helpdesk.sla_policy for select
  using (helpdesk.is_staff());
create policy sla_policy_admin_write on helpdesk.sla_policy for insert
  with check (helpdesk.is_admin());
create policy sla_policy_admin_update on helpdesk.sla_policy for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy sla_policy_admin_delete on helpdesk.sla_policy for delete
  using (helpdesk.is_admin());

create policy categoria_atendimento_select on helpdesk.categoria_atendimento for select
  using (true);
create policy categoria_atendimento_admin_write on helpdesk.categoria_atendimento for insert
  with check (helpdesk.is_admin());
create policy categoria_atendimento_admin_update on helpdesk.categoria_atendimento for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy categoria_atendimento_admin_delete on helpdesk.categoria_atendimento for delete
  using (helpdesk.is_admin());

create policy categoria_problema_select on helpdesk.categoria_problema for select
  using (true);
create policy categoria_problema_admin_write on helpdesk.categoria_problema for insert
  with check (helpdesk.is_admin());
create policy categoria_problema_admin_update on helpdesk.categoria_problema for update
  using (helpdesk.is_admin()) with check (helpdesk.is_admin());
create policy categoria_problema_admin_delete on helpdesk.categoria_problema for delete
  using (helpdesk.is_admin());

-- ticket: staff vê/edita tudo; solicitante só os da própria empresa, sem
-- poder mudar status/prioridade (isso é triage/atendimento, ação do staff).
create policy ticket_select on helpdesk.ticket for select
  using (helpdesk.is_staff() or empresa_id = helpdesk.current_empresa_id());
create policy ticket_insert on helpdesk.ticket for insert
  with check (
    helpdesk.is_staff()
    or (empresa_id = helpdesk.current_empresa_id() and solicitante_id = auth.uid())
  );
create policy ticket_staff_update on helpdesk.ticket for update
  using (helpdesk.is_staff()) with check (helpdesk.is_staff());

-- comentario: nota interna invisível pro solicitante; staff lê/escreve tudo;
-- solicitante só comenta (não-interno) em ticket da própria empresa.
create policy comentario_select on helpdesk.comentario for select
  using (
    helpdesk.is_staff()
    or (
      not interno
      and exists (
        select 1 from helpdesk.ticket t
        where t.numero = comentario.ticket_id
          and t.empresa_id = helpdesk.current_empresa_id()
      )
    )
  );
create policy comentario_insert on helpdesk.comentario for insert
  with check (
    helpdesk.is_staff()
    or (
      not interno
      and autor_id = auth.uid()
      and exists (
        select 1 from helpdesk.ticket t
        where t.numero = comentario.ticket_id
          and t.empresa_id = helpdesk.current_empresa_id()
      )
    )
  );

-- apontamento_horas: só staff — solicitante não vê horas (spec: portal
-- "sem horas").
create policy apontamento_horas_staff_all on helpdesk.apontamento_horas for all
  using (helpdesk.is_staff()) with check (helpdesk.is_staff());

-- anexo: mesma regra de visibilidade do ticket dono; metadado só, o
-- binário fica atrás de signed URL no Storage (regra separada no bucket).
create policy anexo_select on helpdesk.anexo for select
  using (
    helpdesk.is_staff()
    or exists (
      select 1 from helpdesk.ticket t
      where t.numero = anexo.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
    )
  );
create policy anexo_insert on helpdesk.anexo for insert
  with check (
    helpdesk.is_staff()
    or exists (
      select 1 from helpdesk.ticket t
      where t.numero = anexo.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
    )
  );

-- avaliacao: solicitante avalia (uma vez, pk em ticket_id garante) o
-- próprio chamado; staff só lê.
create policy avaliacao_select on helpdesk.avaliacao for select
  using (
    helpdesk.is_staff()
    or exists (
      select 1 from helpdesk.ticket t
      where t.numero = avaliacao.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
    )
  );
create policy avaliacao_insert on helpdesk.avaliacao for insert
  with check (
    exists (
      select 1 from helpdesk.ticket t
      where t.numero = avaliacao.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
    )
  );

-- ticket_evento: mesma visibilidade do ticket; só staff registra evento
-- (a timeline é escrita pela ação do analista, não pelo solicitante).
create policy ticket_evento_select on helpdesk.ticket_evento for select
  using (
    helpdesk.is_staff()
    or exists (
      select 1 from helpdesk.ticket t
      where t.numero = ticket_evento.ticket_id
        and t.empresa_id = helpdesk.current_empresa_id()
    )
  );
create policy ticket_evento_staff_insert on helpdesk.ticket_evento for insert
  with check (helpdesk.is_staff());
