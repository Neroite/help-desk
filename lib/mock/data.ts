import type {
  Anexo,
  ApontamentoHoras,
  Avaliacao,
  CategoriaAtendimento,
  CategoriaProblema,
  Comentario,
  Empresa,
  SlaPolicy,
  Ticket,
  TicketEvento,
  Usuario,
} from "@/lib/types"

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
  { id: "u-pedro", nome: "Pedro Alves", email: "pedro@globex.com", papel: "solicitante", empresaId: "globex", avatarIniciais: "PA" },
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
  { id: "software", nome: "Software", paiId: null },
  { id: "software-erp", nome: "ERP", paiId: "software" },
  { id: "software-email", nome: "E-mail", paiId: "software" },
]

export const slaPolicies: SlaPolicy[] = [
  { prioridade: null, minutosResposta: 120, minutosSolucao: 480 },
  { prioridade: "critica", minutosResposta: 60, minutosSolucao: 240 },
  { prioridade: "alta", minutosResposta: 120, minutosSolucao: 480 },
  { prioridade: "media", minutosResposta: 240, minutosSolucao: 960 },
  { prioridade: "baixa", minutosResposta: 480, minutosSolucao: 2400 },
]

const h = (offsetHoras: number) => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + offsetHoras * 60)
  return d.toISOString()
}

export const tickets: Ticket[] = [
  {
    numero: 482,
    titulo: "Impressora do financeiro não imprime",
    descricao: "A impressora HP do setor financeiro está exibindo erro de papel mesmo com a bandeja cheia.",
    empresaId: "acme",
    solicitanteId: "u-maria",
    analistaId: "u-joao",
    statusKey: "em_andamento",
    prioridade: "alta",
    catAtendimentoId: "remoto",
    catProblemaId: "hardware-impressora",
    criadoEm: h(-5),
    primeiraRespostaEm: h(-4.8),
    finalizadoEm: null,
    slaRespostaVenceEm: h(-4.8),
    slaSolucaoVenceEm: h(0.2),
    slaPausadoEm: null,
    slaMinutosPausados: 0,
  },
  {
    numero: 481,
    titulo: "Solicitação de acesso ao sistema de RH",
    descricao: "Novo colaborador precisa de acesso ao portal de RH.",
    empresaId: "acme",
    solicitanteId: "u-maria",
    analistaId: null,
    statusKey: "aguardando_aprovacao",
    prioridade: null,
    catAtendimentoId: null,
    catProblemaId: null,
    criadoEm: h(-1),
    primeiraRespostaEm: null,
    finalizadoEm: null,
    slaRespostaVenceEm: h(1),
    slaSolucaoVenceEm: h(7),
    slaPausadoEm: h(-0.9),
    slaMinutosPausados: 0,
  },
  {
    numero: 480,
    titulo: "ERP travando ao gerar relatório mensal",
    descricao: "Ao gerar o relatório de fechamento, o ERP trava e precisa ser reiniciado.",
    empresaId: "globex",
    solicitanteId: "u-pedro",
    analistaId: "u-carla",
    statusKey: "pausado",
    prioridade: "critica",
    catAtendimentoId: "remoto",
    catProblemaId: "software-erp",
    criadoEm: h(-8),
    primeiraRespostaEm: h(-7.5),
    finalizadoEm: null,
    slaRespostaVenceEm: h(-7),
    slaSolucaoVenceEm: h(-4),
    slaPausadoEm: h(-2),
    slaMinutosPausados: 60,
  },
  {
    numero: 479,
    titulo: "Configurar nova estação de trabalho",
    descricao: "Novo funcionário precisa de estação configurada com os softwares padrão.",
    empresaId: "acme",
    solicitanteId: "u-maria",
    analistaId: "u-joao",
    statusKey: "a_fazer",
    prioridade: "baixa",
    catAtendimentoId: "presencial",
    catProblemaId: null,
    criadoEm: h(-2),
    primeiraRespostaEm: null,
    finalizadoEm: null,
    slaRespostaVenceEm: h(6),
    slaSolucaoVenceEm: h(38),
    slaPausadoEm: null,
    slaMinutosPausados: 0,
  },
  {
    numero: 478,
    titulo: "E-mail não sincroniza no celular",
    descricao: "Conta corporativa parou de sincronizar no aplicativo de e-mail do celular.",
    empresaId: "globex",
    solicitanteId: "u-pedro",
    analistaId: "u-carla",
    statusKey: "finalizado",
    prioridade: "media",
    catAtendimentoId: "telefone",
    catProblemaId: "software-email",
    criadoEm: h(-30),
    primeiraRespostaEm: h(-29.5),
    finalizadoEm: h(-20),
    slaRespostaVenceEm: h(-26),
    slaSolucaoVenceEm: h(-14),
    slaPausadoEm: null,
    slaMinutosPausados: 0,
  },
  {
    numero: 477,
    titulo: "Chamado aberto em duplicidade",
    descricao: "Aberto por engano, duplicado do #478.",
    empresaId: "globex",
    solicitanteId: "u-pedro",
    analistaId: "u-carla",
    statusKey: "cancelado",
    prioridade: null,
    catAtendimentoId: null,
    catProblemaId: null,
    criadoEm: h(-31),
    primeiraRespostaEm: null,
    finalizadoEm: h(-30.5),
    slaRespostaVenceEm: null,
    slaSolucaoVenceEm: null,
    slaPausadoEm: null,
    slaMinutosPausados: 0,
  },
]

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
