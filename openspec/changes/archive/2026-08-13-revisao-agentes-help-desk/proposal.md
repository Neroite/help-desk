## Why

O repositório `Ticket` é um help desk construído inteiramente sobre `lib/mock/data.ts` — não há backend. A spec validada em `docs/superpowers/specs/2026-08-04-help-desk-design.md` promete 9 fases (0 Supabase/auth/RLS, 1 motor de SLA + Vitest, ... 8 dashboard/CSV), mas os 5 commits do repositório são todos de UI: a fase 0 nunca começou. Isso torna qualquer revisão de código ambígua por padrão — quase toda ação de escrita na UI é não-persistente por desenho, não por bug. Precisamos de um processo repetível (agentes dedicados) que revise o código, corrija bugs reais, e separe com evidência "feature de enfeite não-declarada" de "stub pré-backend esperado", sem que o próprio processo produza uma enxurrada de falsos positivos ou aplique correções que colidam com o roadmap.

## What Changes

- Adiciona 7 arquivos de agent em `.claude/agents/`: um orquestrador (`revisao-lead`, model opus) e 6 subagentes de execução (model sonnet): `auditor-intencao`, `auditor-bugs`, `auditor-enfeites`, `corretor-lote`, `verificador-build`, `verificador-runtime`.
- Define um protocolo de coordenação em ondas (W0 baseline → W1 auditoria paralela → W1.5 triagem e parada obrigatória para aprovação humana → W2 correção em lotes disjuntos → W3 verificação estática e de runtime → W4 relatório final).
- Define uma taxonomia greppável de 14 regras para detectar controles "de enfeite" (botão sem handler, campo não lido, rota fantasma, teatro de sucesso, mentira documental, etc.), calibrada com achados reais já verificados no código e com uma regra anti-falso-positivo obrigatória.
- Define o formato de saída do inventário de achados (`docs/revisao/<data>/`: `baseline.md`, `inventario.md`, `achados.json`, `correcoes.md`, `verificacao.md`) com três categorias: bug real, stub pré-backend declarado, enfeite não-declarado.
- Adiciona o script `"typecheck": "tsc --noEmit"` ao `package.json` (não existe hoje; único comando de verificação estática confiável neste repo sem testes).
- Não implementa nenhuma correção de código de produto neste change — este change entrega o processo/ferramental de revisão; a execução da primeira rodada de auditoria e as correções aprovadas acontecem depois, ao aplicar este change.

## Capabilities

### New Capabilities
- `code-review-agents`: conjunto de agentes Claude Code (orquestrador + subagentes) e o protocolo de coordenação que audita o código do help desk, distingue bug real de stub pré-backend de enfeite não-declarado, e aplica correções aprovadas em lotes verificados.

### Modified Capabilities
(nenhuma — não há specs existentes em `openspec/specs/`, este é o primeiro capability formal do repositório)

## Impact

- Novo diretório `.claude/agents/` com 7 arquivos de definição de agent (nenhum existe hoje).
- `package.json`: uma linha adicionada (`typecheck`).
- Nenhum código de produto (`app/`, `components/`, `lib/`) é alterado por este change — as correções reais acontecem numa aplicação posterior deste ferramental, controlada por aprovação humana explícita na W1.5.
- Gera artefatos versionados em `docs/revisao/<data>/` a cada execução (fora do escopo deste change, mas o formato é parte da spec).
