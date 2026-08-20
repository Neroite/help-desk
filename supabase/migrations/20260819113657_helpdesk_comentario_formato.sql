-- Como renderizar o corpo do comentário: 'texto' (padrão, whitespace-pre-wrap,
-- todo o histórico existente) ou 'html' (só o que sair do editor rich text --
-- ver render-html.ts, que constrói o HTML no servidor a partir de JSON,
-- nunca aceitando HTML vindo do cliente).
alter table helpdesk.comentario
  add column formato text not null default 'texto'
    check (formato in ('texto', 'html'));
