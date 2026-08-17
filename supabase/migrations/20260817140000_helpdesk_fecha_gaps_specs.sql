-- Fecha lacunas entre o schema existente (helpdesk_*, migrations de
-- 2026-08-07 a 2026-08-14, aplicadas antes deste change OpenSpec) e as
-- specs escritas em openspec/changes/backend-supabase.

-- E-mail e CNPJ duplicados devem ser rejeitados (spec administracao).
alter table helpdesk.usuario
  add constraint usuario_email_unico unique (email);

alter table helpdesk.empresa
  add constraint empresa_cnpj_unico unique (cnpj);

-- Minutos de SLA invalidos devem ser rejeitados (spec administracao).
alter table helpdesk.sla_policy
  add constraint sla_policy_minutos_positivos
  check (minutos_resposta > 0 and minutos_solucao > 0);

-- Fim anterior ao inicio deve ser rejeitado (spec apontamento-horas).
alter table helpdesk.apontamento_horas
  add constraint apontamento_fim_apos_inicio
  check (fim is null or fim >= inicio);

-- categoria_problema precisa de "ativo" para desativar em vez de excluir
-- quando ha chamado referenciando (spec administracao).
alter table helpdesk.categoria_problema
  add column ativo boolean not null default true;

-- Maximo de 2 niveis: uma categoria cujo pai ja tem pai proprio e invalida.
create or replace function helpdesk.categoria_problema_valida_profundidade()
returns trigger
language plpgsql
as $$
begin
  if new.pai_id is not null then
    if exists (
      select 1 from helpdesk.categoria_problema
      where id = new.pai_id and pai_id is not null
    ) then
      raise exception 'categoria_problema: maximo de 2 niveis (pai ja e filha de outra categoria)';
    end if;
  end if;
  return new;
end;
$$;

create trigger categoria_problema_profundidade
  before insert or update of pai_id on helpdesk.categoria_problema
  for each row execute function helpdesk.categoria_problema_valida_profundidade();

-- anexo.tipo para diferenciar preview de imagem de documento.
alter table helpdesk.anexo
  add column tipo text check (tipo in ('imagem', 'documento'));
