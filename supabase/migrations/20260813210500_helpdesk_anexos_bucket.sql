-- Bucket PRIVADO dos anexos do help desk. Não reaproveita os buckets do
-- ByteFlow (product-images/avatars) porque aqueles são públicos: anexo de
-- chamado carrega dado de cliente e só sai por signed URL de vida curta.
insert into storage.buckets (id, name, public, file_size_limit)
values ('helpdesk-anexos', 'helpdesk-anexos', false, 10485760)
on conflict (id) do nothing;

-- Convenção de path: ticket/<numero>/<uuid>-<nome>. A função extrai o
-- número do chamado do caminho e devolve null se o path fugir do padrão —
-- assim uma policy nunca quebra com erro de cast, só nega o acesso.
create function helpdesk.anexo_ticket_do_path(caminho text)
returns bigint
language sql
immutable
set search_path = pg_temp
as $$
  select case
    when caminho ~ '^ticket/[0-9]+/' then split_part(caminho, '/', 2)::bigint
    else null
  end
$$;

-- Mesma regra de visibilidade de helpdesk.anexo: staff vê tudo, solicitante
-- só o que pertence a chamado da própria empresa.
create policy helpdesk_anexo_select on storage.objects for select
  using (
    bucket_id = 'helpdesk-anexos'
    and (
      helpdesk.is_staff()
      or exists (
        select 1 from helpdesk.ticket t
        where t.numero = helpdesk.anexo_ticket_do_path(name)
          and t.empresa_id = helpdesk.current_empresa_id()
      )
    )
  );

create policy helpdesk_anexo_insert on storage.objects for insert
  with check (
    bucket_id = 'helpdesk-anexos'
    and helpdesk.anexo_ticket_do_path(name) is not null
    and (
      helpdesk.is_staff()
      or exists (
        select 1 from helpdesk.ticket t
        where t.numero = helpdesk.anexo_ticket_do_path(name)
          and t.empresa_id = helpdesk.current_empresa_id()
      )
    )
  );

-- Remoção só pelo staff: solicitante não apaga evidência de chamado.
create policy helpdesk_anexo_delete on storage.objects for delete
  using (bucket_id = 'helpdesk-anexos' and helpdesk.is_staff());
