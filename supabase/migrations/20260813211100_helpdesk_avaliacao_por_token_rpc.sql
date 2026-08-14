-- Duas RPCs são a ÚNICA porta pública da avaliação. Nenhuma policy de
-- SELECT anônimo é aberta em helpdesk.ticket: quem tem o token recebe só o
-- número e o título do próprio chamado, nada mais.
--
-- SECURITY DEFINER é intencional aqui (o chamador é `anon`, sem linha em
-- helpdesk.usuario, logo `current_empresa_id()` seria null e a RLS negaria
-- tudo). O search_path fixo evita injeção por resolução de nome.

create function helpdesk.chamado_por_token(p_token uuid)
returns table (numero bigint, titulo text, ja_avaliado boolean)
language sql
stable
security definer
set search_path = helpdesk, pg_temp
as $$
  select t.numero, t.titulo, (a.ticket_id is not null) as ja_avaliado
  from helpdesk.ticket t
  left join helpdesk.avaliacao a on a.ticket_id = t.numero
  where t.token_avaliacao = p_token
    -- Só chamado encerrado pode ser avaliado; enquanto aberto o link é inerte.
    and t.status_key = 'finalizado'
$$;

create function helpdesk.avaliar_por_token(
  p_token uuid,
  p_estrelas smallint,
  p_comentario text default null
)
returns void
language plpgsql
security definer
set search_path = helpdesk, pg_temp
as $$
declare
  v_numero bigint;
begin
  if p_estrelas is null or p_estrelas < 1 or p_estrelas > 5 then
    raise exception 'Avaliação deve ser de 1 a 5 estrelas.';
  end if;

  select t.numero into v_numero
  from helpdesk.ticket t
  where t.token_avaliacao = p_token
    and t.status_key = 'finalizado';

  if v_numero is null then
    raise exception 'Link de avaliação inválido ou chamado ainda não finalizado.';
  end if;

  -- A PK em ticket_id já garante uma avaliação por chamado; o do nothing
  -- transforma o reenvio do formulário em no-op em vez de erro feio.
  insert into helpdesk.avaliacao (ticket_id, estrelas, comentario)
  values (v_numero, p_estrelas, nullif(btrim(p_comentario), ''))
  on conflict (ticket_id) do nothing;
end;
$$;

revoke all on function helpdesk.chamado_por_token(uuid) from public;
revoke all on function helpdesk.avaliar_por_token(uuid, smallint, text) from public;
grant execute on function helpdesk.chamado_por_token(uuid) to anon, authenticated;
grant execute on function helpdesk.avaliar_por_token(uuid, smallint, text) to anon, authenticated;
