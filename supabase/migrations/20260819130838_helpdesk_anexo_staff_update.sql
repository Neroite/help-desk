-- Falta uma policy de UPDATE em helpdesk.anexo -- só tinha select/insert/delete.
-- Precisa pra ligar comentario_id a um anexo que subiu antes do comentário
-- existir (anexar arquivo dentro do modal de comentário: upload imediato,
-- vínculo só depois que o insert do comentário devolve o id). Espelha a
-- policy de delete já existente (anexo_staff_delete): só staff usa o editor
-- rico de comentário, então staff-only é suficiente.
create policy anexo_staff_update on helpdesk.anexo for update
  using (helpdesk.is_staff());
