# Design System Override — Landing pública (Aegis)

> Escopo: **apenas** `app/(site)/**` e `components/site/**`. Nada aqui se aplica a
> `(app)/`, `(portal)/`, `/login` ou qualquer outra rota do produto — lá o `MASTER.md`
> continua valendo integralmente.

**Design Dials nesta página:** Variance 6/10 (Balanced) | Motion 6/10 (Standard) | Density 3/10 (Spacious)
— contra 3/3/8 do Master (`MASTER.md:11`). É a página de aquisição do produto, não um
painel operacional: densidade baixa e motion padrão de conversão são a escolha correta aqui.

## Overrides declarados contra `MASTER.md:169-172`

| Anti-pattern do Master | Status nesta página | Regra |
|---|---|---|
| Padrão de landing page (hero, CTA, prova social) | **Permitido** | É a própria natureza da página — ela existe para converter visitante, diferente do produto |
| Tipografia oversized | **Permitido, mas só via chaves aditivas** | `--text-d1`/`--text-d2`/`--text-d3`/`--text-lead` (novas, em `app/globals.css`). A escala densa do dashboard (`--text-xs`…`--text-2xl`) continua intocada e **proibida** nesta página — ver regra abaixo |
| Scroll reveal / GSAP ScrollTrigger | **Permitido, com teto** | Máximo ~8 pontos de reveal na página inteira, `viewport={{ once: true }}`, 300–450ms, só `opacity`+`transform` (nunca layout), `prefers-reduced-motion` obrigatório |
| Border-radius acima de 8px | **Permitido no escopo `.landing`** | `--radius: 14px` reescala `rounded-*` só dentro da classe `.landing`. Componentes de mockup (`.ui-preview`) resetam para `--radius: 6px` — precisam parecer o produto real, não a landing |

## Regra adicional: nunca usar a escala de texto do dashboard aqui

`text-base`/`text-lg`/`text-xl`/`text-2xl` estão inlinados pelo Tailwind (`@theme inline`
em `app/globals.css`) com os valores compactos do dashboard (14/16/20/24px) — **não são
re-escopáveis por wrapper**. Usar essas classes na landing produz tipografia
inconsistente com o resto da página. Use sempre `text-eyebrow`/`text-lead`/`text-d3`/
`text-d2`/`text-d1`. `text-sm`/`text-xs` seguem permitidos para microcopy.

## Regra de cor: `--accent`/`#d97706` nunca é fundo de botão com texto branco

Contraste branco-sobre-âmbar ≈ 3.4:1, abaixo do mínimo de 4.5:1 para texto normal. CTA
primário é sempre `--primary` (navy) com texto branco. Âmbar é usado como eyebrow, régua,
sublinhado e realce pontual — ou, se virar fundo de botão, o texto **precisa** ser
`#0f172a` (≈5.9:1), nunca branco.

## O que continua valendo (não é override, é herança do Master)

- Contraste de texto ≥ 4.5:1 em light e dark
- Foco visível em todo elemento interativo — nunca remover o anel
- Cor nunca é o único portador de informação
- Ícones SVG (Lucide) — sem emoji
- Responsivo em 375 / 768 / 1024 / 1440, sem scroll horizontal

## Notas de arquitetura (por que, não o quê)

- **`--site-navy` é um token fixo, não `--primary`.** `--primary` inverte para um tom mais
  claro no dark mode (`app/globals.css:216`, pensado para manter contraste em botões
  pequenos). Um bloco full-bleed com texto branco por cima perderia contraste se seguisse
  essa inversão — por isso a seção de prova de escala usa `--site-navy: #1e3a8a` fixo nos
  dois temas.
- **Mockups de produto são recriados em JSX, nunca screenshot.** Ver `design.md` da change
  `landing-aegis` para o raciocínio completo — em resumo: screenshot envelhece a cada
  mudança de UI e arriscaria vazar dado de cliente; o clone estático usa os mesmos tokens
  de cor e portanto segue light/dark de graça.
- **Usuário autenticado sem papel definido passa a ver a landing em `/`** em vez de um app
  vazio (efeito colateral aceito da mudança de `middleware.ts` — não é regressão de
  segurança, apenas de UX incidental).
