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
  ticketId: number
  autorId: string
  corpo: string
  interno: boolean
  criadoEm: string
}

export interface ApontamentoHoras {
  id: string
  ticketId: number
  analistaId: string
  inicio: string
  // `fim` e `minutos` são nulos enquanto o timer está rodando; só o
  // encerramento (pararTimer) preenche os dois de uma vez.
  fim: string | null
  minutos: number | null
  descricao: string | null
  faturavel: boolean
}

export interface Anexo {
  id: string
  ticketId: number | null
  comentarioId: string | null
  nome: string
  tamanhoKb: number
  tipo: "imagem" | "documento"
}

export interface Avaliacao {
  ticketId: number
  estrelas: 1 | 2 | 3 | 4 | 5
  comentario: string
}

export type TicketEventoTipo =
  | "criado"
  | "status"
  | "atribuicao"
  | "prioridade"
  | "inicio"
  | "pausa"
  | "retomada"
  | "categoria"

export interface TicketEvento {
  id: string
  ticketId: number
  tipo: TicketEventoTipo
  de: string | null
  para: string
  autorId: string
  corpo: string | null
  criadoEm: string
}

export interface Ticket {
  numero: number
  titulo: string
  descricao: string
  empresaId: string
  solicitanteId: string
  analistaId: string | null
  statusKey: StatusKey
  prioridade: Prioridade | null
  catAtendimentoId: string | null
  catProblemaId: string | null
  criadoEm: string
  primeiraRespostaEm: string | null
  finalizadoEm: string | null
  slaRespostaVenceEm: string | null
  slaSolucaoVenceEm: string | null
  slaPausadoEm: string | null
  slaMinutosPausados: number
  ultimaInteracaoEm: string | null
  ultimaInteracaoPapel: Papel | null
  // Campos só do mock antigo (sem coluna real em helpdesk.ticket) — a UI
  // que ainda os usa trata como enriquecimento opcional, não dado real.
  assunto?: string
  contatoId?: string
  mesa?: Mesa
  atualizadoEm?: string
  tarefasAbertas?: number
  tarefasConcluidas?: number
}

export type SlaSeveridade = "ok" | "atencao" | "critico" | "estourado" | "pausado"
