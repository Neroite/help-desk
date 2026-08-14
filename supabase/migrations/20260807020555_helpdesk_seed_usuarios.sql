-- ⚠️ SEED DE DESENVOLVIMENTO — NÃO APLICAR EM PRODUÇÃO.
-- Cria 6 contas de demonstração com a MESMA senha conhecida ('Senha123!').
-- Serve para subir um ambiente local/de teste com os três papéis prontos.
-- Em produção, criar usuários via Supabase Auth (convite/signup) e nunca
-- executar esta migration; se ela já tiver rodado num projeto que virou
-- produção, trocar a senha das seis contas antes de expor o sistema.

with usuarios_auth as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated',
    v.email, crypt('Senha123!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
  from (values
    ('admin@helpdesk.dev'),
    ('ana.silva@helpdesk.dev'),
    ('bruno.costa@helpdesk.dev'),
    ('carla.mendes@helpdesk.dev'),
    ('maria@acme.com.br'),
    ('joao@contoso.com.br')
  ) as v(email)
  returning id, email
),
identidades as (
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', now(), now(), now()
  from usuarios_auth u
  returning user_id
)
insert into helpdesk.usuario (id, email, nome, papel, empresa_id, ativo)
select u.id, u.email, m.nome, m.papel::helpdesk.papel, e.id, true
from usuarios_auth u
join identidades idn on idn.user_id = u.id
join (values
  ('admin@helpdesk.dev', 'Admin Geral', 'admin', null::text),
  ('ana.silva@helpdesk.dev', 'Ana Silva', 'analista', null::text),
  ('bruno.costa@helpdesk.dev', 'Bruno Costa', 'analista', null::text),
  ('carla.mendes@helpdesk.dev', 'Carla Mendes', 'analista', null::text),
  ('maria@acme.com.br', 'Maria Souza', 'solicitante', 'ACME Ltda'),
  ('joao@contoso.com.br', 'João Pereira', 'solicitante', 'Contoso Serviços')
) as m(email, nome, papel, empresa_nome) on m.email = u.email
left join helpdesk.empresa e on e.nome = m.empresa_nome;
