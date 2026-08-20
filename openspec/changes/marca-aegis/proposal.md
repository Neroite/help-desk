## Why

O help desk se apresentava como "Help-Desk", com três tratamentos de marca diferentes e
nenhum arquivo de logo (monograma "HD" na sidebar da equipe, ícone `Ticket` genérico no
login e no cluster animado, texto puro sem ícone no portal). O produto passa a se chamar
**Aegis**, com um escudo angular azul/laranja como ícone único — decisão fechada com o
usuário: só "Aegis", sem "Help Desk" como descritor.

## What Changes

- Cria `components/brand/aegis-logo.tsx`: SVG inline do escudo (corpo em `currentColor`,
  herda a cor do contexto claro/escuro/sidebar; acento laranja em token próprio
  `--brand-accent`, fixo entre temas).
- Substitui todo ponto de marca por Aegis: monograma da sidebar da equipe, topbar do
  portal (que não tinha ícone nenhum antes), ícone e wordmark do login, ícone central do
  cluster animado do login (satélites e animações continuam intactos), `<title>`/metadata
  da página, e o favicon (`app/icon.svg` substitui o `app/favicon.ico` padrão do Next).
- Não toca: schema Postgres `helpdesk`, bucket `helpdesk-anexos`, nome do pacote
  `help-desk` no `package.json`, e-mails de seed `@helpdesk.dev` — nada disso é
  superfície visível ao usuário final.

## Capabilities

### New Capabilities
- `identidade-visual`: logo, ícone de página e nome do produto consistentes em todo
  shell (equipe, portal, login).

## Impact

- **Marca**: `components/brand/aegis-logo.tsx` (novo), token `--brand-accent` em
  `app/globals.css`.
- **Pontos de troca**: `app/(app)/app-shell.tsx`, `app/(portal)/portal-shell.tsx`,
  `app/login/page.tsx`, `app/login/login-icon-cluster.tsx`, `app/layout.tsx`, `app/icon.svg`
  (novo, substitui `app/favicon.ico`, removido).
- Fora do escopo: redesenho de `README.md`/`MASTER.md`, rename do pacote npm, migração de
  dado (schema, bucket, e-mails de seed) — nenhum deles é marca visível ao usuário.
