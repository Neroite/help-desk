## Context

Ver `proposal.md` para a motivação. Constraints técnicas que moldam a abordagem:

- Tailwind v4 sem `tailwind.config`: toda a paleta e escala vivem em `@theme inline` dentro
  de `app/globals.css:7-110`. Verificado no bundle compilado
  (`.next/static/chunks/*.css`): `--text-xs`…`--text-2xl` são **inlinados como literais**
  pelo Tailwind (`.text-base{font-size:14px}`), então redefinir essas variáveis num wrapper
  não tem efeito nenhum — só `--radius` (usado como `var(--radius)`/`calc(...)` nas
  `rounded-*`) permanece referência e é re-escopável.
- `middleware.ts` já resolve redirecionamento por papel; a landing só precisa entrar na
  lista de rotas públicas sem quebrar essa lógica.
- `design-system/help-desk/MASTER.md:169-172` proíbe padrão de landing page, mas `:3-5`
  abre a exceção via `pages/<page>.md` — usada aqui em vez de reescrever o MASTER.
- Sem clientes reais: qualquer prova social precisa de um mecanismo que impeça número
  inventado de aparecer como real por engano futuro (não só hoje).
- `@base-ui/react/accordion` já está em `node_modules`; `sharp` está presente mas fora do
  `package-lock.json` (hoist incidental, não confiável em build).

## Goals / Non-Goals

**Goals:**
- Landing estática (`○ Static`) em `/`, sem custo de sessão para o visitante anônimo.
- Zero regressão na guarda de rotas existente (`(app)`, `(portal)`, `/login`, `/avaliar/*`).
- Zero impacto visual/token no app quando a landing não está sendo visitada.
- Prova social e copy auditáveis contra invenção, por construção (não por revisão manual).

**Non-Goals:**
- Rebranding do produto para "Aegis" dentro do app (login, shells, metadata interna).
- Qualquer feature nova no produto (e-mail, alertas, relatórios) — a landing só descreve o
  que já existe.
- Internacionalização — só português, como o resto do produto.

## Decisions

**Escala tipográfica de display aditiva, não sobrescrita.** Como `--text-xs..2xl` são
inlinados pelo Tailwind, a alternativa de "wrapper `.landing` redefine `--text-*`" não
funciona para essa faixa. Decisão: chaves novas (`--text-lead`, `--text-d1..d3`) dentro do
mesmo `@theme inline`, com `clamp()` embutido. Nenhuma classe usada hoje pelo app muda de
valor porque nenhuma chave existente é tocada. Alternativa descartada: mover a escala
inteira para fora de `@theme inline` (perderia a geração de utilities do Tailwind) ou usar
`style={{fontSize}}` inline (perde a integração com `dark:`/responsive do Tailwind).

**`--radius` re-escopado via classe `.landing`, com reset `.ui-preview` para os mockups.**
`--radius` é referência de variável em todas as `rounded-*`, então isso funciona (diferente
da tipografia). Os mockups de produto precisam do raio original de 6px para parecerem o
produto real, não a landing — por isso `.ui-preview` reseta `--radius:6px` dentro da moldura
do mockup, provando que o escopo funciona nos dois sentidos.

**Mockups de produto recriados em JSX, nunca screenshot.** Alternativas descartadas:
(a) importar os componentes reais (`TicketCard`, `SlaBadge`) — rejeitada porque `SlaBadge`
é client component com `useSlaClock()`, produzindo mismatch de hidratação sem
`ReferenceDataProvider`, ausente na landing; (b) capturar screenshot do produto — rejeitada
porque envelhece a cada mudança de UI e exigiria dado de cliente ou fixture, correndo risco
de vazar dado real. Clones estáticos com strings literais e os mesmos tokens de cor
resolvem: seguem light/dark de graça e nunca ficam desatualizados na aparência.

**Prova social com sentinela de placeholder, não comentário.** Um `TODO` em comentário é
invisível em runtime — nada impede alguém de commitar um número chutado sem notar. Decisão:
valor que começa com `{{` é tratado como não-apurado por um componente central
(`<Metrica>`), que se recusa a renderizá-lo como número. Enquanto isso, a seção de prova de
escala mostra fatos verificáveis no código (expediente do motor de SLA, contagem de status,
papéis, RLS) em vez de vaidade. Troca para número real quando houver dado é uma edição de
uma linha no arquivo de conteúdo, sem tocar em componente.

**Acordeão via `npx shadcn add accordion` sobre Base UI, não `collapsible` manual nem
`<details>`.** `collapsible` (já existente) exigiria reimplementar navegação por
seta/Home/End à mão; `<details name>` para um-aberto-por-vez ainda não é confiável em todos
os browsers-alvo. Base UI já está instalado, então o custo é zero dependência nova.

**`/` público, mas com guarda de sessão preservada por ordem de regras no middleware,** não
por lógica nova. A regra existente que redireciona usuário autenticado saindo de `/` para o
shell do papel já roda antes da checagem de shell interno — só precisa continuar nessa
ordem. Registrar essa dependência de ordem em comentário evita regressão futura.

**Navy fixo (`--site-navy`) em vez de `--primary` no bloco de prova de escala.** `--primary`
inverte para um tom mais claro no dark mode (para manter contraste em botões pequenos), o
que reduziria o contraste de um bloco full-bleed com texto branco. Um token de marca fixo,
paralelo mas não substituto de `--primary`, evita essa dependência indesejada.

## Risks / Trade-offs

- [Visitante com sessão expirada/stale ainda paga round-trip ao Auth em `/`] → aceitável;
  o early-return de custo cobre apenas o caso sem cookie de sessão, que é a maioria do
  tráfego anônimo de uma landing.
- [Usuário autenticado sem linha em `helpdesk.usuario` passa a ver a landing em vez de um
  app vazio] → mudança de comportamento incidental, mas estritamente melhor (não é
  regressão de segurança: continua sem acesso a dado nenhum).
- [OG image e sitemap/robots ficarem atrás do matcher do middleware, quebrando preview em
  redes sociais e indexação] → mitigado tornando `og.png` estático (com extensão, já
  excluída pelo matcher) e adicionando `/robots.txt`/`/sitemap.xml` às rotas públicas.
- [`shadcn add accordion` trazer Radix em vez de Base UI, quebrando a consistência visual
  com o resto do app] → mitigado revisando o diff do comando antes de aceitar; fallback é
  escrever os 5 wrappers à mão sobre `@base-ui/react/accordion`.
- [Copy prometendo capacidade não entregue, por otimismo de marketing] → mitigado pelo
  requirement dedicado em `specs/landing-publica` e pelas perguntas negativas explícitas no
  FAQ (é IA? não. Manda e-mail? ainda não.).

## Migration Plan

Sem dado a migrar — mudança é aditiva em rotas e arquivos novos, mais um diff pequeno e
reversível em `middleware.ts` e `app/globals.css`. Rollback: reverter o commit único da
change; nenhuma migration de banco envolvida.
