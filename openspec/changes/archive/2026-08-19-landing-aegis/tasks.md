## 1. Design system e autorização de override

- [x] 1.1 Criar `design-system/help-desk/pages/landing.md`: escopo restrito a
      `app/(site)/**` e `components/site/**`, dials 6/6/3, cada override item a item contra
      `MASTER.md:169-172` (hero/CTA/prova social permitidos, tipografia grande via chaves
      aditivas, scroll reveal com teto de ~8 pontos e `prefers-reduced-motion`, `--radius:14px`
      só no escopo `.landing`), e o que continua valendo (contraste ≥4.5:1, foco visível,
      cor nunca é único sinal, ícones Lucide, 375/768/1024/1440)
- [x] 1.2 Corrigir `design-system/help-desk/MASTER.md:3` (caminho do override) e acrescentar
      nota de exceção em `:169`

## 2. Acordeão

- [x] 2.1 Rodar `npx shadcn add accordion`
- [x] 2.2 Revisar o diff: confirmar import de `@base-ui/react/accordion` (não `@radix-ui/*`)
      e que `app/globals.css` não foi tocado; se vier Radix, reverter e escrever os 5
      wrappers à mão sobre `@base-ui/react/accordion`, no molde de `components/ui/collapsible.tsx`

## 3. Tokens aditivos (app inteiro em risco neste passo)

- [x] 3.1 Adicionar bloco aditivo em `app/globals.css` dentro do `@theme inline` existente
      (após `:109`): `--text-eyebrow`, `--text-lead`, `--text-d3`, `--text-d2`, `--text-d1`
      (todos com `clamp()`), `--font-display`
- [x] 3.2 Rodar `npm run build` e conferir visualmente `/chamados` e `/login` — único
      momento em que o app inteiro está em risco por esta change (build limpo, 16 rotas ok)

## 4. Roteamento público

- [x] 4.1 Editar `middleware.ts`: adicionar `"/"`, `"/robots.txt"`, `"/sitemap.xml"` a
      `ROTAS_PUBLICAS`, com comentário explicando por quê; adicionar comentário acima da
      regra que redireciona `/`/`/login` para o shell do papel, marcando a dependência de
      ordem com a guarda de shell interno
- [x] 4.2 Adicionar early-return por ausência de cookie `sb-*` para `/`, `/robots.txt`,
      `/sitemap.xml`, evitando `getUser()` em todo pageview anônimo
- [x] 4.3 Deletar `app/page.tsx`
- [x] 4.4 Criar `app/(site)/layout.tsx` (carrega Plus Jakarta Sans, aplica classe `landing`),
      `app/(site)/site.css` (escopo de `--radius`, `--site-navy`, `.ui-preview`, reduced-motion),
      `app/(site)/page.tsx` com um `<h1>Aegis</h1>` de esqueleto
- [x] 4.5 Testar a matriz de guarda para os casos anônimos (`/` 200, `/chamados` → 307
      `/login`, `/login` 200, `/avaliar/abc` 200) antes de escrever qualquer seção de
      conteúdo. Os casos autenticados por papel ficam para a verificação final (11.2), que
      exige login real

## 5. Marca

- [x] 5.1 Criar `components/site/aegis-logo.tsx` (`AegisMark` + `AegisLogo`, SVG inline,
      "A" vazado via `fill-rule="evenodd"`, cores por `var(--site-brand, #1e40af)` /
      `var(--site-brand-accent, #d97706)`, wordmark em `currentColor`)
- [x] 5.2 Criar `app/icon.svg` a partir do mesmo path do `AegisMark`, fundo branco explícito
- [x] 5.3 Gerar `public/og.png` (1200×630, estático) com `sharp` local — não
      `app/opengraph-image.tsx`; commitar o PNG

## 6. Conteúdo e prova social

- [x] 6.1 Criar `lib/site/prova-social.ts`: sentinela `{{`, `ehPlaceholder()`, `METRICAS`,
      `LOGOS_CLIENTES`/`DEPOIMENTOS` vazios de propósito, `FATOS` com números verificáveis
      no código (expediente, status, papéis, RLS)
- [x] 6.2 Criar `components/site/metrica.tsx`: renderiza `—` + `sr-only` quando o valor é
      placeholder, nunca renderiza um `{{...}}` como número
- [x] 6.3 Criar `lib/site/conteudo.ts` com toda a copy das 10 seções (`as const`), incluindo
      as perguntas negativas do FAQ (IA? não. E-mail? ainda não. Relatórios? ainda não.
      WhatsApp? não.)

## 7. Mockups de produto

- [x] 7.1 Criar `components/site/browser-chrome.tsx` (moldura com dots, URL falsa,
      `overflow-hidden`, conteúdo marcado `.ui-preview`)
- [x] 7.2 Criar `components/site/mockups/pecas.tsx` (`MockStatus`, `MockPrioridade`,
      `MockSla`, `MockAvatar`, tokens de `lib/status.ts`)
- [x] 7.3 Criar `components/site/mockups/mock-kanban.tsx`, `mock-chamado.tsx`,
      `mock-sla-pausa.tsx`, `mock-portal.tsx`, `mock-avaliacao.tsx` — clones estáticos com
      strings literais, zero import de `components/chamado/`, zero `Date.now()`, cada um
      com `role="img"` + `aria-label` descritivo e interior `aria-hidden`
- [x] 7.4 Validar os 5 mockups isoladamente em light e dark — verificado via screenshot no
      dev server (light e dark, desktop e mobile 375px); achado e corrigido: `nativeButton`
      ausente em 3 botões que renderizavam `<a>` (Base UI console error), overflow
      horizontal em 375px por `min-width:auto` implícito nos itens de grid do hero e do
      como-funciona (corrigido com `min-w-0`)

## 8. Motion e chrome de página

- [x] 8.1 Criar `components/site/reveal.tsx` (curto-circuito em `useReducedMotion()`, só
      `opacity`+`y`, `viewport={{ once: true }}`, ~420ms)
- [x] 8.2 Criar `components/site/site-header.tsx` (sticky, `IntersectionObserver` para
      `data-scrolled`, menu mobile em fluxo — nunca `Sheet`, para não escapar do escopo
      `.landing` via portal — skip-link)
- [x] 8.3 Criar `components/site/site-footer.tsx`

## 9. Seções

- [x] 9.1 `components/site/secoes/hero.tsx`
- [x] 9.2 `components/site/secoes/prova-de-escala.tsx`
- [x] 9.3 `components/site/secoes/para-quem.tsx`
- [x] 9.4 `components/site/secoes/dor-virada.tsx`
- [x] 9.5 `components/site/secoes/pilares.tsx`
- [x] 9.6 `components/site/secoes/como-funciona.tsx`
- [x] 9.7 `components/site/secoes/beneficios-cta.tsx`
- [x] 9.8 `components/site/secoes/faq.tsx` (Accordion, um-aberto-por-vez — confirmado por
       teste em browser: expanded=true/false correto, fecha o anterior ao abrir outro)
- [x] 9.9 `components/site/secoes/cta-final.tsx`
- [x] 9.10 Compor todas as seções em `app/(site)/page.tsx`, substituindo o esqueleto do
       passo 4.4

## 10. Metadata e descoberta

- [x] 10.1 Adicionar `metadataBase` em `app/layout.tsx`
- [x] 10.2 Definir `metadata` em `app/(site)/layout.tsx` (title, description, OpenGraph
       apontando para `public/og.png`)
- [x] 10.3 Criar `app/robots.ts` e `app/sitemap.ts`

## 11. Verificação

- [x] 11.1 `npm run typecheck && npm run lint && npm run test && npm run build` — todos
       limpos; `test` em 9 arquivos reais (não 7 — `lib/relatorios/*` é código de fase 8
       adicionado depois do número no `CLAUDE.md`, não relacionado a esta change); `/`
       aparece como `○ (Static)`, 14.9 kB
- [x] 11.2 Matriz de guarda testada via browser real: deslogado em `/` → landing 200;
       deslogado em `/chamados` → 307 `/login`; `/login` 200; `/avaliar/<token>` 200;
       `/robots.txt`, `/sitemap.xml`, `/icon.svg`, `/og.png` → 200 sem 307; logado (sessão
       existente) em `/` → redirecionou corretamente para `/chamados?view=kanban`;
       `/logout` → signOut e volta a `/login`. Não testado com conta `solicitante` real (sem
       credencial disponível nesta sessão) — a lógica em `middleware.ts:84-92` cobre esse
       caso e não foi alterada, só ganhou `/` na lista de públicas
- [x] 11.3 Responsividade verificada em 375 (mobile) e 1440 (desktop) via screenshot real:
       **bug real encontrado e corrigido** — grid do hero e do como-funciona estourava
       100vw em 375px (`min-width:auto` implícito em item de CSS Grid com o Kanban de
       largura fixa dentro); corrigido com `min-w-0` nos itens de grid. Mockup do Kanban
       usa `overflow-x-auto` interno. Mockups em "como funciona" renderizam abaixo do texto
       em mobile, inclusive nos blocos invertidos. 768/1024 não verificados nesta sessão
- [x] 11.4 Contraste checado visualmente em light e dark (screenshot): navy+branco ok;
       nenhum botão usa `--accent`/`#d97706` como fundo com texto branco (grep confirmou
       zero uso de token amber de marca — removido por não estar em uso); badges de
       prioridade usam os tokens `-solid` já auditados no app original
- [x] 11.5 FAQ testado via `snapshot`/`click`/`focus`: `aria-expanded` alterna certo,
       `region` aparece ao abrir, um-aberto-por-vez confirmado. **Achado de documentação**:
       Base UI removeu navegação por seta (↑/↓) em acordeões na atualização 2024 do WAI-ARIA
       APG — hoje é só Tab + Enter/Space, o que ainda é acessível, mas diverge do que o
       `design.md` (§5) descreveu; vale corrigir a nota lá. `prefers-reduced-motion` não
       testado nesta sessão. Botão de menu mobile tinha `size-10` (40px, abaixo do mínimo de
       toque de 44px) — corrigido para `size-11`
- [x] 11.6 Grep `text-(base|lg|xl|2xl)`: achou 1 resultado (`aegis-logo.tsx` — wordmark em
       `text-lg`) e corrigiu para `text-lead`. Zero resultados após a correção
- [x] 11.7 Revisão final da copy contra a lista de features entregues e não entregues.
       **Achado real**: o FAQ respondia "Ainda não" para "Tem dashboard, relatório ou
       exportação?", mas a fase 8 já estava entregue (`lib/relatorios/`, rota `/dashboard`,
       botão "Exportar CSV") — a landing negava uma capacidade existente. Corrigido em
       `lib/site/conteudo.ts`, junto do comentário do topo do arquivo, que repetia o erro.
       O requirement "Copy restrita a funcionalidades entregues" foi corrigido no delta
       spec pelo mesmo motivo e ganhou a regra explícita de valer nas duas direções.
       Resto da copy conferido item a item: e-mail transacional e alerta de SLA (fase 7,
       adiada) seguem declarados como não entregues, IA/chatbot/WhatsApp/telefone como
       inexistentes, e nenhuma outra seção promete o que o produto não faz.
       **Não verificado**: larguras 768 e 1024 (a lacuna que a 11.3 registra) — a sessão
       de navegador estava compartilhada com outro agente trabalhando no repositório e
       não valia o risco de atrapalhar; segue como pendência conhecida
