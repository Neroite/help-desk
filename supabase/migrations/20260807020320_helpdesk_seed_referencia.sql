with empresas_novas as (
  insert into helpdesk.empresa (nome, cnpj) values
    ('ACME Ltda', '12.345.678/0001-90'),
    ('Contoso Serviços', '98.765.432/0001-10')
  returning id, nome
)
insert into helpdesk.sla_policy (prioridade, minutos_resposta, minutos_solucao) values
  (null, 120, 480),
  ('baixa', 240, 2880),
  ('media', 120, 1440),
  ('alta', 60, 480),
  ('critica', 15, 240);

insert into helpdesk.categoria_atendimento (nome) values ('Remoto'), ('Presencial'), ('Telefone');

with pai as (
  insert into helpdesk.categoria_problema (nome) values ('Hardware'), ('Software'), ('Rede')
  returning id, nome
)
insert into helpdesk.categoria_problema (nome, pai_id)
select filho.nome, pai.id
from pai
join (values
  ('Hardware', 'Impressora'),
  ('Hardware', 'Computador'),
  ('Software', 'Sistema Operacional'),
  ('Software', 'Aplicativo'),
  ('Rede', 'Internet'),
  ('Rede', 'Wi-Fi')
) as filho(pai_nome, nome) on filho.pai_nome = pai.nome;

insert into helpdesk.empresa_status (empresa_id, status_key, ativo, ordem)
select e.id, s.status_key, true, s.ordem
from helpdesk.empresa e
cross join (values
  ('aguardando_aprovacao'::helpdesk.status_key, 0),
  ('a_fazer'::helpdesk.status_key, 1),
  ('em_andamento'::helpdesk.status_key, 2),
  ('pausado'::helpdesk.status_key, 3),
  ('finalizado'::helpdesk.status_key, 4),
  ('cancelado'::helpdesk.status_key, 5)
) as s(status_key, ordem);
