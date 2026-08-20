## Why

Dois problemas concretos na conversa do chamado, achados na exploração desta rodada:
a descrição que o solicitante escreve ao abrir o chamado nunca aparece pro analista (só
existia no portal e no preview da fila — sumia justamente para quem vai atender), e o
comentário no detalhe do chamado tinha dois caminhos redundantes (uma pill que filtrava a
timeline e um composer inline sempre visível, sem editor de texto). A referência Milvus usa
um único modal com editor rico (negrito, itálico, listas, link, imagem) — decisão fechada
com o usuário: a pill "Comentários" passa a abrir o modal, o filtro de timeline morre, e a
descrição vira o primeiro comentário do chamado, com migration retroativa.

## What Changes

- Pill "Comentários" abre `NovoComentarioDialog`; o composer inline (`ComentarioComposer`)
  sai do detalhe do chamado (continua existindo só para o portal do solicitante, que
  mantém o campo simples de texto). Pills "Base de conhecimento"/"E-mail" (stubs com
  contador hardcoded/toast "Em breve") são removidas.
- O modal de comentário ganha um editor rich text leve (Tiptap): negrito, itálico,
  sublinhado, lista com marcador, lista numerada, link e imagem. Imagem colada ou
  arrastada sobe automaticamente como anexo `inline` do chamado (não aparece na lista de
  "Anexos" — já fica embutida no corpo do comentário) e é referenciada por
  `/api/anexos/<id>`, uma rota nova que reemite uma signed URL fresca a cada acesso (o
  bucket é privado; uma URL fixa expiraria em 60s).
- O HTML do comentário é **construído no servidor** a partir do JSON do editor
  (`editor.getJSON()`) — o cliente nunca envia HTML pronto. Nó ou atributo não
  reconhecido pela allowlist simplesmente não é emitido; comentário de texto puro
  (histórico e o composer do portal) continua no formato antigo.
- `criarChamado` passa a gravar, junto do ticket, um comentário público autorado pelo
  solicitante com o texto da descrição — a descrição vira o primeiro item da conversa.
  Migration retroativa e idempotente aplica o mesmo tratamento aos chamados já existentes.

## Capabilities

### Modified Capabilities
- `chamado-interacao`: pill "Comentários" abre o modal diretamente (sem filtro de
  timeline nem botão redundante); o modal ganha editor rich text com imagem; a descrição
  do chamado passa a existir também como o primeiro comentário da conversa.
- `anexos`: anexo `inline` (colado/arrastado no editor de comentário) não aparece na
  lista de "Anexos" do chamado — já está embutido no corpo do comentário — e é servido
  por uma rota própria que valida tipo de imagem e reemite signed URL a cada acesso.

## Impact

- **Editor**: `components/chamado/comentario-editor.tsx` (novo, Tiptap — `@tiptap/react`,
  `@tiptap/pm`, `@tiptap/starter-kit`, extensões `underline`/`link`/`image`), montado só
  via `next/dynamic(ssr:false)` em `novo-comentario-dialog.tsx` (evita divergência de
  hidratação servidor/cliente).
- **Construção de HTML**: `lib/comentario/render-html.ts` (novo, módulo puro, testado —
  `render-html.test.ts`, 11 casos).
- **Backend**: `lib/tickets/actions.ts` (`adicionarComentario` aceita
  `documentoRico`/JSON do editor; `criarChamado` grava a descrição como comentário via
  insert direto — não via `adicionarComentario`, que zeraria `primeira_resposta_em` se o
  autor fosse staff); `lib/tickets/anexos.ts` (`anexarArquivo` devolve `{id}`, aceita
  `inline`/`revalidar`); `app/api/anexos/[id]/route.ts` (novo route handler).
- **Migrations** (`supabase/migrations/`, projeto `byteflow-pro`): `comentario.origem`
  (marcador `'usuario'`/`'descricao'`) + backfill retroativo idempotente;
  `comentario.formato` (`'texto'`/`'html'`); `anexo.inline` (bool).
- **Timeline**: `components/chamado/ticket-timeline.tsx` e `ticket-preview-sheet.tsx`
  renderizam `formato: 'html'` via `dangerouslySetInnerHTML` (seguro — o HTML só existe
  quando construído no servidor), com fallback `whitespace-pre-wrap` para texto puro.
- Fora do escopo: editor rich text no composer do portal ou no formulário de abertura
  (ambos continuam `Textarea` simples — evita o problema de subir imagem para um chamado
  que ainda não tem número).
