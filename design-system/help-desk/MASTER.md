# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/help-desk/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Help-Desk
**Category:** Operations Dashboard (help desk / ticketing, modelo MSP)
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)
**Fonte de verdade completa:** `docs/superpowers/specs/2026-08-04-help-desk-design.md`

Este arquivo é o resumo operacional dos tokens. O spec acima tem o raciocínio completo (fluxo de usuários, arquitetura de telas, componentes).

---

## Style Guidelines

**Style:** Data-Dense Dashboard (não "Exaggerated Minimalism" — o gerador sugeriu por padrão, mas essa categoria é de landing page/portfolio. O produto é um painel operacional que o analista encara o dia inteiro, então a escolha correta é densidade alta com hierarquia clara, sem elementos de conversão)

**Keywords:** Grid 12 colunas, padding curto, KPI cards, tabelas com sort, densidade máxima sem virar ruído, foco em leitura rápida

**Best For:** Dashboards operacionais, ferramentas internas, painéis de suporte/atendimento

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E40AF` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3B82F6` | `--color-secondary` |
| Accent/CTA | `#D97706` | `--color-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Surface | `#FFFFFF` | `--color-surface` |
| Foreground | `#0F172A` | `--color-foreground` |
| Muted foreground | `#64748B` | `--color-muted-fg` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#1E40AF` | `--color-ring` |

**Color Notes:** Azul para ação/dados, âmbar para atenção. Accent ajustado de `#F59E0B` para `#D97706` pra atingir contraste 3:1 em texto grande.

### Status do chamado

| Status | Hex | CSS Variable |
|---|---|---|
| Aguardando aprovação | `#D97706` | `--status-aguardando` |
| A fazer | `#64748B` | `--status-a-fazer` |
| Em andamento | `#2563EB` | `--status-andamento` |
| Pausado | `#7C3AED` | `--status-pausado` |
| Finalizado | `#059669` | `--status-finalizado` |
| Cancelado | `#94A3B8` | `--status-cancelado` |

Cor nunca é o único sinal — cada status sempre acompanha ícone + rótulo.

### SLA (semáforo)

| Estado | Hex | CSS Variable | Regra |
|---|---|---|---|
| OK | `#059669` | `--sla-ok` | > 50% do prazo restante |
| Atenção | `#D97706` | `--sla-atencao` | < 50% do prazo restante |
| Crítico | `#DC2626` | `--sla-critico` | < 10% ou menos de 15min |
| Estourado | `#991B1B` | `--sla-estourado` | fundo sólido, texto branco |
| Pausado | `#64748B` | `--sla-pausado` | relógio congelado |

### Typography

- **UI Font:** Fira Sans
- **Mono Font:** Fira Code — usado em número de ticket, contagem de SLA e horas, sempre com `font-variant-numeric: tabular-nums` (evita o contador "tremer" a cada tick)
- **Mood:** dashboard, dado, técnico, preciso
- **Google Fonts:** [Fira Sans + Fira Code](https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

**Escala** — corpo da interface a 14px, tabela a 13px, nunca abaixo de 12px:

| Token | Value |
|---|---|
| `--text-xs` | 12px |
| `--text-sm` | 13px |
| `--text-base` | 14px |
| `--text-lg` | 16px |
| `--text-xl` | 20px |
| `--text-2xl` | 24px |

### Spacing & Layout Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps |
| `--space-2` | `8px` | Standard padding, grid gap |
| `--space-3` | `12px` | Card padding |
| `--space-4` | `16px` | Large gaps |
| `--space-6` | `24px` | Section margins |
| `--space-8` | `32px` | Page padding |
| `--sidebar-w` | `240px` | Sidebar fixa (desktop) |
| `--topbar-h` | `56px` | Topbar sticky |
| `--row-h` | `36px` | Altura de linha de tabela |
| `--radius` | `6px` | Raio padrão — NÃO usar 8/12/16 (isso é linguagem de landing page) |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Linha de tabela em hover |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modais, sheets |

---

## Component Specs

Base é shadcn/ui (ver seção 5 do spec para lista completa de componentes de domínio). Regras de estilo:

```css
/* Botão primário — raio 6px, não 8px */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

/* Card — raio 6px, padding compacto (12px, não 24px) */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--card-pad); /* 12px */
}

/* Input */
.input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--text-base); /* 14px, não 16px */
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
```

Não usar `transform: translateY(-2px)` em hover de card/linha de tabela — em densidade 8/10, elementos empilhados que se movem no hover geram ruído visual. Hover muda só `background` ou `box-shadow`.

---

## Motion

Dial 3/10 — subtle. Nada de scroll-reveal (isso é padrão de landing page, não existe scroll de descoberta num dashboard). Transições de 150–300ms em: hover, troca de status, abrir/fechar sheet/dialog. `prefers-reduced-motion` sempre respeitado.

---

## Anti-Patterns (Do NOT Use)

(exceto `app/(site)/` — ver `pages/landing.md`, que documenta os overrides item a item)

- ❌ Padrão de landing page (hero, CTA, prova social) — este é um produto interno, não converte visitante
- ❌ Tipografia oversized / `clamp(3rem, 10vw, 12rem)` — isso é para editorial/portfolio
- ❌ Scroll reveal / GSAP ScrollTrigger — não há scroll de descoberta num dashboard
- ❌ Border-radius acima de 8px em componentes de dado (tabela, badge, input)
- ❌ Emojis como ícone — usar SVG (Lucide)
- ❌ Cor como único portador de informação em status/SLA — sempre ícone + rótulo junto
- ❌ `setInterval` individual por componente de SLA — usar um único `SlaClockProvider` compartilhado
- ❌ Interação que só existe via drag-and-drop (kanban) — sempre ter alternativa por teclado/select

---

## Pre-Delivery Checklist

- [ ] Contraste de texto ≥ 4.5:1 em light e dark
- [ ] Foco visível em todo elemento interativo (nunca remover o anel)
- [ ] Cor nunca é o único portador de informação
- [ ] `prefers-reduced-motion` respeitado; transições 150–300ms
- [ ] Sem scroll horizontal em 375px — tabela sempre em `overflow-x-auto`
- [ ] Filtros e visão refletidos na URL; botão voltar funciona
- [ ] Estados de carregando / vazio / erro em toda lista
- [ ] Ícones SVG (Lucide) — 16px em tabela, 20px em navegação
- [ ] `cursor-pointer` em tudo que é clicável
- [ ] Responsivo em 375 / 768 / 1024 / 1440
