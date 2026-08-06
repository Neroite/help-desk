export type StatusKey =
  | "aguardando_aprovacao"
  | "a_fazer"
  | "em_andamento"
  | "pausado"
  | "finalizado"
  | "cancelado"

export const STATUS_KEYS: StatusKey[] = [
  "aguardando_aprovacao",
  "a_fazer",
  "em_andamento",
  "pausado",
  "finalizado",
  "cancelado",
]

export const STATUS_FINAIS: StatusKey[] = ["finalizado", "cancelado"]
export const STATUS_PAUSA_SLA: StatusKey[] = ["pausado", "aguardando_aprovacao"]

export type Prioridade = "baixa" | "media" | "alta" | "critica"

export const PRIORIDADES: Prioridade[] = ["baixa", "media", "alta", "critica"]

export type Papel = "admin" | "analista" | "solicitante"

export type Mesa = "Service Desk" | "Field" | "N2"

export const MESAS: Mesa[] = ["Service Desk", "Field", "N2"]

export interface Empresa {
  id: string
  nome: string
  cnpj: string
  ativo: boolean
  statusAtivos: StatusKey[]
  statusRotulos: Partial<Record<StatusKey, string>>
}

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  empresaId: string | null
  avatarIniciais: string
}

export interface CategoriaAtendimento {
  id: string
  nome: string
}

export interface CategoriaProblema {
  id: string
  nome: string
  paiId: string | null
}

export interface SlaPolicy {
  prioridade: Prioridade | null
  minutosResposta: number
  minutosSolucao: number
}

export interface Comentario {
  id: string
  ticketId: string
  autorId: string
  corpo: string
  interno: boolean
  criadoEm: string
}

export interface ApontamentoHoras {
  id: string
  ticketId: string
  analistaId: string
  inicio: string
  fim: string | null
  minutos: number
  descricao: string
  faturavel: boolean
}

export interface Anexo {
  id: string
  ticketId: string
  comentarioId: string | null
  nome: string
  tamanhoKb: number
  tipo: "imagem" | "documento"
}

export interface Avaliacao {
  ticketId: string
  estrelas: 1 | 2 | 3 | 4 | 5
  comentario: string
}

export type TicketEventoTipo = "criado" | "status" | "atribuicao" | "prioridade"

export interface TicketEvento {
  id: string
  ticketId: string
  tipo: TicketEventoTipo
  de: string | null
  para: string
  autorId: string
  criadoEm: string
}

export interface Ticket {
  numero: number
  titulo: string
  assunto: string
  descricao: string
  empresaId: string
  solicitanteId: string
  contatoId: string
  analistaId: string | null
  mesa: Mesa
  statusKey: StatusKey
  prioridade: Prioridade | null
  catAtendimentoId: string | null
  catProblemaId: string | null
  criadoEm: string
  atualizadoEm: string
  primeiraRespostaEm: string | null
  finalizadoEm: string | null
  slaRespostaVenceEm: string | null
  slaSolucaoVenceEm: string | null
  slaPausadoEm: string | null
  slaMinutosPausados: number
  tarefasAbertas: number
  tarefasConcluidas: number
}

export type SlaSeveridade = "ok" | "atencao" | "critico" | "estourado" | "pausado"
