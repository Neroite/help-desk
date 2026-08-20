## 1. Pill abre modal, composer inline e filtro morrem

- [x] 1.1 Pill "Comentários" (`chamado-detalhe-client.tsx`) passa a abrir
      `NovoComentarioDialog`; botão de ícone redundante ao lado removido
- [x] 1.2 `<ComentarioComposer>` removido do detalhe do chamado — arquivo continua
      existindo, só o portal (`comentarios-section.tsx`) usa
- [x] 1.3 Filtro de timeline removido: `FiltroTimeline` (tipo), estado `timelineFiltro`,
      handler `alternarFiltro`, prop `filtro` de `TicketTimeline` — mensagem de vazio
      passa a "Nenhuma interação ainda."
- [x] 1.4 Pill "Anexos" abre modal com `AnexoList` (`anexos-dialog.tsx`, novo, mesmo
      padrão de `apontamento-horas-dialog.tsx`)
- [x] 1.5 Pills "Base de conhecimento" (contador hardcoded) e "E-mail" (stub
      `toast("Em breve")`) removidas — eram enfeite não-declarado, não stub de fase futura

## 2. Editor rich text com imagens

- [x] 2.1 Instalar `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`,
      `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-image`
      (compatíveis com React 19, sem `--legacy-peer-deps`)
- [x] 2.2 `lib/comentario/render-html.ts` (novo, puro): constrói HTML a partir do JSON do
      editor — nó/atributo desconhecido não é emitido; `img` só aceita
      `/api/anexos/<uuid>`; `a` só `http`/`https`/`mailto`, com
      `rel="noopener noreferrer" target="_blank"`; escapa `& < > "`
- [x] 2.3 `render-html.test.ts` — 11 casos (marcas aninhadas, listas, link com/sem
      protocolo permitido, imagem aceita/rejeitada, nó desconhecido preserva texto, doc
      vazio/inválido)
- [x] 2.4 `components/chamado/comentario-editor.tsx` (novo): toolbar
      negrito/itálico/sublinhado/listas/link/imagem; paste/drop de imagem sobe via
      `anexarArquivo(..., {inline: true, revalidar: false})` e insere
      `<img src="/api/anexos/<id>">`
- [x] 2.5 `novo-comentario-dialog.tsx`: `Textarea` → editor, via
      `next/dynamic(ssr:false)` (evita hidratação divergente); `onEnviar` passa a devolver
      `Promise<void>` e o modal só registra horas **depois** que o comentário persiste
      (corrige risco identificado no plano: apontamento órfão se o comentário falhasse)
- [x] 2.6 `app/api/anexos/[id]/route.ts` (novo): GET autenticado por cookies (RLS
      aplica — sem linha, 404), valida mimetype via `storage.list()` contra allowlist de
      imagem (415 caso contrário), reemite signed URL fresca via redirect 307
- [x] 2.7 `anexarArquivo` (`lib/tickets/anexos.ts`) devolve `{id}` e aceita
      `inline`/`revalidar`; migration `anexo.inline` (bool); `listarAnexos` filtra
      `inline = false` (imagem embutida no comentário não duplica na lista)
- [x] 2.8 `Comentario` ganha `formato: "texto" | "html"`; `ticket-timeline.tsx` e
      `ticket-preview-sheet.tsx` renderizam html via `dangerouslySetInnerHTML` com
      fallback texto; `.prose-comentario` em `globals.css`

## 3. Descrição vira comentário

- [x] 3.1 Migration `comentario.origem` (`'usuario'`/`'descricao'`, marcador de
      idempotência, eixo diferente de `formato`)
- [x] 3.2 Migration retroativa: `insert ... where not exists (... origem = 'descricao')`
      — confirmado 0 linhas ao rodar duas vezes; preenche
      `ultima_interacao_em`/`ultima_interacao_papel` só quando ainda nulos
- [x] 3.3 `criarChamado`: insert direto em `comentario` (NÃO via `adicionarComentario`,
      que gravaria `primeira_resposta_em` se o autor fosse staff — quem abre em nome do
      cliente é sempre staff aqui, o que zeraria o SLA de resposta no instante da
      criação), autor = solicitante, `origem: "descricao"`, só quando descrição não vazia

## 4. Verificação

- [x] 4.1 `npm run lint`, `npm run typecheck`, `npm run test` (76/76), `npm run build` —
      todos limpos
- [x] 4.2 Confirmado em runtime (agent-browser, login real): editor abriu sem erro de
      hidratação; negrito aplicado (`<strong>` confirmado no HTML do editor); comentário
      enviado e renderizado na timeline via `dangerouslySetInnerHTML` sem warning de
      console; abertura de chamado novo gerou "Comentários 1" (a descrição) de imediato
