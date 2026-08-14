-- A tabela de metadados só tinha select/insert; sem delete, remover um anexo
-- deixaria a linha órfã apontando para um objeto já apagado do Storage.
-- Espelha a policy do bucket: só staff remove.
create policy anexo_staff_delete on helpdesk.anexo for delete
  using (helpdesk.is_staff());
