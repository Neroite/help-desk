import type {
  Anexo,
  ApontamentoHoras,
  Avaliacao,
  CategoriaAtendimento,
  CategoriaProblema,
  Comentario,
  Empresa,
  Mesa,
  Prioridade,
  SlaPolicy,
  StatusKey,
  Ticket,
  TicketEvento,
  Usuario,
} from "@/lib/types"
import { MESAS, STATUS_FINAIS, STATUS_PAUSA_SLA } from "@/lib/types"

export const empresas: Empresa[] = [
  {
    id: "acme",
    nome: "ACME Ltda",
    cnpj: "12.345.678/0001-90",
    ativo: true,
    statusAtivos: [
      "aguardando_aprovacao",
      "a_fazer",
      "em_andamento",
      "pausado",
      "finalizado",
      "cancelado",
    ],
    statusRotulos: {},
  },
  {
    id: "globex",
    nome: "Globex Corporation",
    cnpj: "98.765.432/0001-10",
    ativo: true,
    statusAtivos: ["a_fazer", "em_andamento", "pausado", "finalizado"],
    statusRotulos: { a_fazer: "Fila", em_andamento: "Atendendo" },
  },
]

export const usuarios: Usuario[] = [
  { id: "u-admin", nome: "Sofia Admin", email: "sofia@helpdesk.io", papel: "admin", empresaId: null, avatarIniciais: "SA" },
  { id: "u-joao", nome: "João Pereira", email: "joao@helpdesk.io", papel: "analista", empresaId: null, avatarIniciais: "JP" },
  { id: "u-carla", nome: "Carla Nunes", email: "carla@helpdesk.io", papel: "analista", empresaId: null, avatarIniciais: "CN" },
  { id: "u-maria", nome: "Maria Silva", email: "maria@acme.com", papel: "solicitante", empresaId: "acme", avatarIniciais: "MS" },
  { id: "u-ana", nome: "Ana Costa", email: "ana@acme.com", papel: "solicitante", empresaId: "acme", avatarIniciais: "AC" },
  { id: "u-pedro", nome: "Pedro Alves", email: "pedro@globex.com", papel: "solicitante", empresaId: "globex", avatarIniciais: "PA" },
  { id: "u-jefferson", nome: "Jefferson Lima", email: "jefferson@globex.com", papel: "solicitante", empresaId: "globex", avatarIniciais: "JL" },
]

export const categoriasAtendimento: CategoriaAtendimento[] = [
  { id: "remoto", nome: "Remoto" },
  { id: "presencial", nome: "Presencial" },
  { id: "telefone", nome: "Telefone" },
]

export const categoriasProblema: CategoriaProblema[] = [
  { id: "hardware", nome: "Hardware", paiId: null },
  { id: "hardware-impressora", nome: "Impressora", paiId: "hardware" },
  { id: "hardware-rede", nome: "Rede", paiId: "hardware" },
  { id: "hardware-notebook", nome: "Notebook", paiId: "hardware" },
  { id: "software", nome: "Software", paiId: null },
  { id: "software-erp", nome: "ERP", paiId: "software" },
  { id: "software-email", nome: "E-mail", paiId: "software" },
  { id: "software-acesso", nome: "Acesso", paiId: "software" },
]

export const slaPolicies: SlaPolicy[] = [
  { prioridade: null, minutosResposta: 120, minutosSolucao: 480 },
  { prioridade: "critica", minutosResposta: 60, minutosSolucao: 240 },
  { prioridade: "alta", minutosResposta: 120, minutosSolucao: 480 },
  { prioridade: "media", minutosResposta: 240, minutosSolucao: 960 },
  { prioridade: "baixa", minutosResposta: 480, minutosSolucao: 2400 },
]

// Âncora fixa em vez de `new Date()` — este módulo é avaliado em processos
// separados no servidor (SSR) e no cliente; `new Date()` no escopo do módulo
// gera um milissegundo diferente em cada avaliação e quebra a hidratação
// (o `dateTime` de cada <time> divergia entre servidor e cliente). Uma data
// fixa é 100% determinística nos dois lados.
const AGORA_MOCK = new Date("2026-08-05T20:00:00.000Z").getTime()

const h = (offsetHoras: number) => {
  return new Date(AGORA_MOCK + offsetHoras * 3_600_000).toISOString()
}

// --- Geração de chamados de demonstração -----------------------------------
// A fila precisa de volume real (o Milvus mostra dezenas de linhas) e de
// severidade de SLA espalhada (no prazo / atenção / crítico / estourado /
// pausado) pra que o semáforo e as barras de progresso apareçam de verdade
// já na primeira tela. `criarTicket` deriva os prazos de `slaPolicies` a
// partir de quando o chamado "nasceu" (`criadoHorasAtras`), igual a um seed
// de banco faria — não é o motor de SLA real (esse é a fase 1 do backend).
interface TicketSeed {
  numero: number
  titulo: string
  assunto: string
  empresaId: string
  solicitanteId: string
  contatoId: string
  analistaId: string | null
  mesa: Mesa
  statusKey: StatusKey
  prioridade: Prioridade | null
  catAtendimentoId: string | null
  catProblemaId: string | null
  criadoHorasAtras: number
  atualizadoHorasAtras: number
  tarefasAbertas?: number
  tarefasConcluidas?: number
}

function criarTicket(seed: TicketSeed): Ticket {
  const politica = slaPolicies.find((p) => p.prioridade === seed.prioridade) ?? slaPolicies[0]
  const criadoMs = AGORA_MOCK - seed.criadoHorasAtras * 3_600_000
  const slaRespostaVenceEm = new Date(criadoMs + politica.minutosResposta * 60_000).toISOString()
  const slaSolucaoVenceEm = new Date(criadoMs + politica.minutosSolucao * 60_000).toISOString()
  const final = STATUS_FINAIS.includes(seed.statusKey)
  const pausado = STATUS_PAUSA_SLA.includes(seed.statusKey)

  return {
    numero: seed.numero,
    titulo: seed.titulo,
    assunto: seed.assunto,
    descricao: `${seed.titulo}. Chamado registrado via ${seed.catAtendimentoId ?? "portal"}.`,
    empresaId: seed.empresaId,
    solicitanteId: seed.solicitanteId,
    contatoId: seed.contatoId,
    analistaId: seed.analistaId,
    mesa: seed.mesa,
    statusKey: seed.statusKey,
    prioridade: seed.prioridade,
    catAtendimentoId: seed.catAtendimentoId,
    catProblemaId: seed.catProblemaId,
    criadoEm: h(-seed.criadoHorasAtras),
    atualizadoEm: h(-seed.atualizadoHorasAtras),
    primeiraRespostaEm: seed.analistaId ? h(-(seed.criadoHorasAtras - 0.2)) : null,
    finalizadoEm: final ? h(-Math.max(0.1, seed.atualizadoHorasAtras)) : null,
    slaRespostaVenceEm: final ? null : slaRespostaVenceEm,
    slaSolucaoVenceEm: final ? null : slaSolucaoVenceEm,
    slaPausadoEm: pausado ? h(-Math.min(seed.criadoHorasAtras, 1)) : null,
    slaMinutosPausados: seed.statusKey === "pausado" ? 60 : 0,
    tarefasAbertas: seed.tarefasAbertas ?? 0,
    tarefasConcluidas: seed.tarefasConcluidas ?? 0,
  }
}

// Ticket #482 é o "hero" usado como demonstração rica na tela de detalhe —
// comentários, eventos e apontamentos abaixo se referem só a ele.
const ticketHero = criarTicket({
  numero: 482,
  titulo: "Impressora do financeiro não imprime",
  assunto: "Impressora do financeiro não imprime",
  empresaId: "acme",
  solicitanteId: "u-maria",
  contatoId: "u-maria",
  analistaId: "u-joao",
  mesa: "Service Desk",
  statusKey: "em_andamento",
  prioridade: "alta",
  catAtendimentoId: "remoto",
  catProblemaId: "hardware-impressora",
  criadoHorasAtras: 5,
  atualizadoHorasAtras: 0.5,
  tarefasAbertas: 1,
  tarefasConcluidas: 2,
})

const poolAssuntos: Array<{
  titulo: string
  assunto: string
  catAtendimentoId: string | null
  catProblemaId: string | null
}> = [
  { titulo: "Solicitação de acesso ao sistema de RH", assunto: "acesso RH", catAtendimentoId: "remoto", catProblemaId: "software-acesso" },
  { titulo: "ERP travando ao gerar relatório mensal", assunto: "ERP trava no fechamento", catAtendimentoId: "remoto", catProblemaId: "software-erp" },
  { titulo: "Configurar nova estação de trabalho", assunto: "Preparação de notebook", catAtendimentoId: "presencial", catProblemaId: "hardware-notebook" },
  { titulo: "E-mail não sincroniza no celular", assunto: "e-mail não sincroniza", catAtendimentoId: "telefone", catProblemaId: "software-email" },
  { titulo: "Chamado aberto em duplicidade", assunto: "duplicado", catAtendimentoId: null, catProblemaId: null },
  { titulo: "Rede Wi-Fi instável no 2º andar", assunto: "wifi instável", catAtendimentoId: "presencial", catProblemaId: "hardware-rede" },
  { titulo: "Planilha de custos com erro de fórmula", assunto: "excel", catAtendimentoId: "remoto", catProblemaId: "software-erp" },
  { titulo: "Solicitação de troca de nobreak", assunto: "troca de nobreak", catAtendimentoId: "presencial", catProblemaId: "hardware" },
  { titulo: "Usuário bloqueado no Active Directory", assunto: "usuário bloqueado", catAtendimentoId: "remoto", catProblemaId: "software-acesso" },
  { titulo: "Notebook não liga", assunto: "notebook não liga", catAtendimentoId: "presencial", catProblemaId: "hardware-notebook" },
  { titulo: "Instalação do pacote Office", assunto: "instalar office", catAtendimentoId: "remoto", catProblemaId: "software" },
  { titulo: "Impressora consumindo toner rápido demais", assunto: "toner acabando rápido", catAtendimentoId: "remoto", catProblemaId: "hardware-impressora" },
  { titulo: "VPN não conecta fora do escritório", assunto: "vpn não conecta", catAtendimentoId: "remoto", catProblemaId: "software-acesso" },
  { titulo: "Solicitação de novo monitor", assunto: "novo monitor", catAtendimentoId: "presencial", catProblemaId: "hardware" },
  { titulo: "Sistema ERP lento ao abrir", assunto: "ERP lento", catAtendimentoId: "remoto", catProblemaId: "software-erp" },
  { titulo: "Caixa de e-mail cheia", assunto: "caixa cheia", catAtendimentoId: "remoto", catProblemaId: "software-email" },
  { titulo: "Permissão de pasta compartilhada", assunto: "permissão de pasta", catAtendimentoId: "remoto", catProblemaId: "software-acesso" },
  { titulo: "Teclado sem funcionar", assunto: "teclado com defeito", catAtendimentoId: "presencial", catProblemaId: "hardware" },
  { titulo: "Backup não está rodando", assunto: "backup falhando", catAtendimentoId: "remoto", catProblemaId: "software" },
  { titulo: "Monitor com tela piscando", assunto: "monitor piscando", catAtendimentoId: "presencial", catProblemaId: "hardware" },
]

const cicloEmpresa = [
  { empresaId: "acme", solicitanteId: "u-maria", contatoId: "u-ana" },
  { empresaId: "acme", solicitanteId: "u-ana", contatoId: "u-maria" },
  { empresaId: "globex", solicitanteId: "u-pedro", contatoId: "u-jefferson" },
  { empresaId: "globex", solicitanteId: "u-jefferson", contatoId: "u-pedro" },
]
const cicloAnalista: Array<string | null> = ["u-joao", "u-carla", null, "u-joao", "u-carla", "u-joao"]
const cicloPrioridade: Array<Prioridade | null> = [null, "media", "alta", "baixa", "critica", "media", "alta", null]
// Distribuição pesada nos status "vivos" (a_fazer/em_andamento/pausado) —
// espelha uma fila real, onde a maioria dos chamados ainda está em curso.
const cicloStatusAcme: StatusKey[] = [
  "em_andamento",
  "a_fazer",
  "pausado",
  "aguardando_aprovacao",
  "em_andamento",
  "a_fazer",
  "finalizado",
  "em_andamento",
  "pausado",
  "cancelado",
]
const cicloStatusGlobex: StatusKey[] = ["em_andamento", "a_fazer", "pausado", "em_andamento", "a_fazer", "finalizado"]

const numerosGerados = Array.from({ length: 45 }, (_, i) => 439 + i).filter((n) => n !== 482)

const ticketsGerados: Ticket[] = numerosGerados.map((numero, i) => {
  const seedAssunto = poolAssuntos[i % poolAssuntos.length]
  const seedEmpresa = cicloEmpresa[i % cicloEmpresa.length]
  const statusPool = seedEmpresa.empresaId === "acme" ? cicloStatusAcme : cicloStatusGlobex
  const statusKey = statusPool[i % statusPool.length]
  const analistaId =
    statusKey === "aguardando_aprovacao" ? null : cicloAnalista[i % cicloAnalista.length]
  // Espalha a "idade" do chamado: recente para os vivos, mais antigo para os
  // encerrados — cobre os cinco estados visuais do semáforo de SLA.
  const idadeBase = STATUS_FINAIS.includes(statusKey) ? 40 + (i % 12) * 14 : 1 + (i % 9) * 6
  return criarTicket({
    numero,
    titulo: seedAssunto.titulo,
    assunto: seedAssunto.assunto,
    empresaId: seedEmpresa.empresaId,
    solicitanteId: seedEmpresa.solicitanteId,
    contatoId: seedEmpresa.contatoId,
    analistaId,
    mesa: MESAS[i % MESAS.length],
    statusKey,
    prioridade: cicloPrioridade[i % cicloPrioridade.length],
    catAtendimentoId: seedAssunto.catAtendimentoId,
    catProblemaId: seedAssunto.catProblemaId,
    criadoHorasAtras: idadeBase,
    atualizadoHorasAtras: Math.min(idadeBase, 0.2 + (i % 5)),
    tarefasAbertas: i % 4 === 0 ? 1 : 0,
    tarefasConcluidas: i % 3 === 0 ? 1 : 0,
  })
})

export const tickets: Ticket[] = [ticketHero, ...ticketsGerados].sort((a, b) => b.numero - a.numero)

export const comentarios: Comentario[] = [
  { id: "c1", ticketId: "482", autorId: "u-maria", corpo: "A impressora continua com erro mesmo depois de trocar o papel.", interno: false, criadoEm: h(-5) },
  { id: "c2", ticketId: "482", autorId: "u-joao", corpo: "Já verificou se o sensor da bandeja está limpo? Vou fazer acesso remoto.", interno: false, criadoEm: h(-4.8) },
  { id: "c3", ticketId: "482", autorId: "u-joao", corpo: "Sensor sujo confirmado via acesso remoto. Orientando limpeza.", interno: true, criadoEm: h(-4.5) },
  { id: "c4", ticketId: "482", autorId: "u-maria", corpo: "Limpei o sensor conforme instruído, voltou a funcionar. Obrigada!", interno: false, criadoEm: h(-0.5) },
]

export const ticketEventos: TicketEvento[] = [
  { id: "e1", ticketId: "482", tipo: "criado", de: null, para: "aguardando_aprovacao", autorId: "u-maria", criadoEm: h(-5) },
  { id: "e2", ticketId: "482", tipo: "atribuicao", de: null, para: "u-joao", autorId: "u-joao", criadoEm: h(-4.9) },
  { id: "e3", ticketId: "482", tipo: "prioridade", de: null, para: "alta", autorId: "u-joao", criadoEm: h(-4.9) },
  { id: "e4", ticketId: "482", tipo: "status", de: "a_fazer", para: "em_andamento", autorId: "u-joao", criadoEm: h(-4.8) },
]

export const apontamentos: ApontamentoHoras[] = [
  { id: "a1", ticketId: "482", analistaId: "u-joao", inicio: h(-4.8), fim: h(-4.3), minutos: 30, descricao: "Diagnóstico via acesso remoto", faturavel: true },
  { id: "a2", ticketId: "482", analistaId: "u-joao", inicio: h(-0.6), fim: h(-0.5), minutos: 6, descricao: "Confirmação de solução com o cliente", faturavel: false },
]

export const anexos: Anexo[] = [
  { id: "an1", ticketId: "482", comentarioId: null, nome: "erro-impressora.jpg", tamanhoKb: 842, tipo: "imagem" },
  { id: "an2", ticketId: "482", comentarioId: "c3", nome: "log-diagnostico.txt", tamanhoKb: 12, tipo: "documento" },
]

export const avaliacoes: Avaliacao[] = [
  { ticketId: "478", estrelas: 5, comentario: "Atendimento rápido, resolveu na hora." },
]

export function usuarioPorId(id: string | null): Usuario | undefined {
  return id ? usuarios.find((u) => u.id === id) : undefined
}

export function empresaPorId(id: string): Empresa | undefined {
  return empresas.find((e) => e.id === id)
}

export function ticketPorNumero(numero: number): Ticket | undefined {
  return tickets.find((t) => t.numero === numero)
}
