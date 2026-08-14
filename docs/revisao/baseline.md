# Baseline — antes da aplicação do change `revisao-agentes-help-desk`

Data: 2026-08-13
Comandos rodados a partir do checkout principal (`G:\Projetos\ClaudePro\Ticket`), já que o worktree de isolamento não tem `node_modules`.

## `npx tsc --noEmit`
```
TypeScript: No errors found
EXIT:0
```

## `npm run lint`
```
ESLint: No issues found
EXIT:0
```

## `npm run build` (`next build --turbopack`)
```
✓ Compiled successfully in 8.1s
✓ Generating static pages (15/15)
EXIT:0
```

Rotas e modo de renderização (confirma o risco do design.md: `/dashboard` é `○` estático):
```
○ /                                0 B    127 kB
○ /_not-found                      0 B    127 kB
ƒ /avaliar/[token]             4.75 kB    145 kB
○ /chamados                    19.9 kB    244 kB
ƒ /chamados/[numero]           14.4 kB    238 kB
○ /chamados/meus                   0 B    207 kB
○ /chamados/novo               4.46 kB    229 kB
○ /configuracoes/categorias    4.96 kB    212 kB
○ /configuracoes/empresas      9.33 kB    217 kB
○ /configuracoes/sla           5.76 kB    213 kB
○ /configuracoes/usuarios      5.66 kB    230 kB
○ /dashboard                       0 B    207 kB   ← estático; congela cálculo de SLA no instante do build
○ /portal                      1.86 kB    146 kB
ƒ /portal/chamados/[numero]    4.27 kB    148 kB
○ /portal/novo                    46 kB    206 kB

○ (Static) prerenderizado como conteúdo estático
ƒ (Dynamic) renderizado sob demanda no servidor
```

## Critério de comparação para `verificador-build`

O baseline está 100% limpo (tsc, lint e build sem nenhum erro ou aviso). Isso significa que o critério de "não piorou vs. baseline" equivale, nesta rodada específica, a **"continua 100% limpo"** — qualquer novo erro ou aviso introduzido por uma correção é regressão, não é preciso comparar contagens.

## `git status --porcelain` (checkout principal, no momento da captura)
```
 M app/page.tsx
?? .agents/
?? .claude/
?? CLAUDE.md
?? openspec/
?? skills-lock.json
```
Árvore já estava suja antes desta revisão (WIP pré-existente do usuário, não gerado por este change).
