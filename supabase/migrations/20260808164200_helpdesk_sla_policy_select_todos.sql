drop policy sla_policy_staff_select on helpdesk.sla_policy;

-- Minutos de SLA não são dado sigiloso (é o prazo prometido ao cliente) —
-- criarChamado() precisa ler a política padrão mesmo quando quem abre é
-- o solicitante, não só staff.
create policy sla_policy_select on helpdesk.sla_policy for select
  using (true);
