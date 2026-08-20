## 1. Marca Aegis

- [x] 1.1 Criar `components/brand/aegis-logo.tsx` (SVG do escudo, `currentColor` + acento
      `--brand-accent`)
- [x] 1.2 Adicionar token `--brand-accent` em `app/globals.css` (`:root`, fixo entre temas)
- [x] 1.3 Sidebar da equipe (`app-shell.tsx`): monograma "HD" → `<AegisLogo>`, wordmark
      "Help-Desk" → "Aegis"
- [x] 1.4 Topbar do portal (`portal-shell.tsx`): adicionar ícone (antes só tinha texto) +
      "Aegis"
- [x] 1.5 Login (`app/login/page.tsx`): ícone `Ticket` → `AegisLogo`, wordmark e `<h1>` →
      "Aegis"
- [x] 1.6 Cluster animado do login (`login-icon-cluster.tsx`): ícone central `Ticket` →
      `AegisLogo`, satélites e animações preservados
- [x] 1.7 `app/layout.tsx`: `metadata.title` → "Aegis", description reescrita
- [x] 1.8 Favicon: `app/favicon.ico` removido, `app/icon.svg` criado (convenção do Next,
      confirmado servindo em `/icon.svg` no build)
- [x] 1.9 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` — todos
      limpos
- [x] 1.10 Confirmado em runtime (agent-browser): "Aegis" e o escudo aparecem na sidebar da
      equipe, no login e na aba do navegador
