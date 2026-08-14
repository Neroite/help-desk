create schema if not exists helpdesk;

create type helpdesk.papel as enum ('admin', 'analista', 'solicitante');
create type helpdesk.status_key as enum (
  'aguardando_aprovacao', 'a_fazer', 'em_andamento', 'pausado', 'finalizado', 'cancelado'
);
create type helpdesk.prioridade as enum ('baixa', 'media', 'alta', 'critica');
create type helpdesk.evento_tipo as enum ('criado', 'status', 'atribuicao', 'prioridade');

create table helpdesk.empresa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Vinculado 1:1 a auth.users; carrega papel e empresa (só solicitante tem empresa).
create table helpdesk.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text not null,
  papel helpdesk.papel not null,
  empresa_id uuid references helpdesk.empresa (id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint usuario_solicitante_tem_empresa
    check (papel <> 'solicitante' or empresa_id is not null)
);
create index usuario_empresa_id_idx on helpdesk.usuario (empresa_id);

-- Só liga/desliga e renomeia; a semântica (pausa SLA / é final) mora no
-- código (lib/types.ts), nunca aqui, pra nenhuma config de empresa quebrar
-- o cálculo de prazo.
create table helpdesk.empresa_status (
  empresa_id uuid not null references helpdesk.empresa (id) on delete cascade,
  status_key helpdesk.status_key not null,
  ativo boolean not null default true,
  rotulo text,
  ordem int not null default 0,
  primary key (empresa_id, status_key)
);

create table helpdesk.sla_policy (
  id uuid primary key default gen_random_uuid(),
  prioridade helpdesk.prioridade, -- null = política padrão
  minutos_resposta int not null,
  minutos_solucao int not null,
  unique (prioridade)
);
-- unique() por si só permite múltiplas linhas NULL (NULL != NULL); a política
-- padrão precisa ser única, então um índice parcial cobre esse caso.
create unique index sla_policy_padrao_unica_idx
  on helpdesk.sla_policy ((1)) where (prioridade is null);

create table helpdesk.categoria_atendimento (
  id uuid primary key default gen_random_uuid(),
  nome text not null
);

create table helpdesk.categoria_problema (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  pai_id uuid references helpdesk.categoria_problema (id)
);

create table helpdesk.ticket (
  numero bigint generated always as identity primary key,
  titulo text not null,
  descricao text not null default '',
  empresa_id uuid not null references helpdesk.empresa (id),
  solicitante_id uuid not null references helpdesk.usuario (id),
  analista_id uuid references helpdesk.usuario (id),
  status_key helpdesk.status_key not null default 'a_fazer',
  prioridade helpdesk.prioridade, -- null até o triage
  cat_atendimento_id uuid references helpdesk.categoria_atendimento (id),
  cat_problema_id uuid references helpdesk.categoria_problema (id),
  criado_em timestamptz not null default now(),
  primeira_resposta_em timestamptz,
  finalizado_em timestamptz,
  sla_resposta_vence_em timestamptz,
  sla_solucao_vence_em timestamptz,
  sla_pausado_em timestamptz,
  sla_minutos_pausados int not null default 0
);
create index ticket_empresa_id_idx on helpdesk.ticket (empresa_id);
create index ticket_status_key_idx on helpdesk.ticket (status_key);
create index ticket_analista_id_idx on helpdesk.ticket (analista_id);

create table helpdesk.comentario (
  id uuid primary key default gen_random_uuid(),
  ticket_id bigint not null references helpdesk.ticket (numero) on delete cascade,
  autor_id uuid not null references helpdesk.usuario (id),
  corpo text not null,
  interno boolean not null default false,
  criado_em timestamptz not null default now()
);
create index comentario_ticket_id_idx on helpdesk.comentario (ticket_id);

create table helpdesk.apontamento_horas (
  id uuid primary key default gen_random_uuid(),
  ticket_id bigint not null references helpdesk.ticket (numero) on delete cascade,
  analista_id uuid not null references helpdesk.usuario (id),
  inicio timestamptz not null,
  fim timestamptz,
  minutos int,
  descricao text,
  faturavel boolean not null default true
);
create index apontamento_horas_ticket_id_idx on helpdesk.apontamento_horas (ticket_id);

create table helpdesk.anexo (
  id uuid primary key default gen_random_uuid(),
  ticket_id bigint references helpdesk.ticket (numero) on delete cascade,
  comentario_id uuid references helpdesk.comentario (id) on delete cascade,
  storage_path text not null,
  nome text not null,
  tamanho int not null,
  criado_em timestamptz not null default now(),
  constraint anexo_pertence_a_algo check (ticket_id is not null or comentario_id is not null)
);
create index anexo_ticket_id_idx on helpdesk.anexo (ticket_id);

create table helpdesk.avaliacao (
  ticket_id bigint primary key references helpdesk.ticket (numero) on delete cascade,
  estrelas smallint not null check (estrelas between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);

create table helpdesk.ticket_evento (
  id uuid primary key default gen_random_uuid(),
  ticket_id bigint not null references helpdesk.ticket (numero) on delete cascade,
  tipo helpdesk.evento_tipo not null,
  de text,
  para text not null,
  autor_id uuid not null references helpdesk.usuario (id),
  criado_em timestamptz not null default now()
);
create index ticket_evento_ticket_id_idx on helpdesk.ticket_evento (ticket_id);
