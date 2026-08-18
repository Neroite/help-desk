create table helpdesk.mesa_trabalho (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true
);

create table helpdesk.setor (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa_id uuid references helpdesk.empresa(id)
);

alter table helpdesk.ticket add column mesa_id uuid references helpdesk.mesa_trabalho(id);
alter table helpdesk.usuario add column setor_id uuid references helpdesk.setor(id);

comment on table helpdesk.mesa_trabalho is 'Catálogo global de mesas de trabalho (setores internos da equipe) — não é por empresa.';
comment on table helpdesk.setor is 'Setor do lado do cliente ou da equipe; empresa_id nulo cobre setor interno.';
