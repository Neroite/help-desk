// Copy da landing pública, centralizada para revisão num arquivo só.
// Regra: só descreve o que o produto entrega hoje (fases 0-6 e 8, esta
// última o dashboard/relatórios/CSV). Nada de e-mail nem alerta de SLA
// (fase 7, adiada), nem IA, chatbot ou WhatsApp, que não existem —
// ver specs/landing-publica/spec.md, requirement "Copy restrita a
// funcionalidades entregues".

export const NAV = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#para-quem", label: "Para quem" },
  { href: "#faq", label: "Perguntas frequentes" },
] as const

export const HERO = {
  eyebrow: "Help desk para equipes que levam prazo a sério",
  titulo: "O relógio do SLA que sabe quando parar.",
  subtitulo:
    "Expediente fixo de 09:00 às 18:00, seg. a sex. Quando um chamado é pausado ou fica aguardando aprovação, o prazo congela de verdade — e retoma somando só os minutos úteis que ficaram parados.",
  ctaPrimario: "Entrar",
  ctaSecundario: "Ver como funciona",
} as const

export const PARA_QUEM = [
  {
    titulo: "Analista",
    descricao: "Quem atende o chamado no dia a dia.",
    beneficios: [
      "Fila e Kanban atualizados em tempo real, sem precisar recarregar a página",
      "Apontamento de horas por chamado, direto na timeline",
      "SLA sempre visível — sem precisar calcular prazo de cabeça",
    ],
  },
  {
    titulo: "Admin / gestor",
    descricao: "Quem configura como a equipe trabalha.",
    beneficios: [
      "Política de SLA, categorias e catálogo de status configuráveis por empresa",
      "Cadastro de empresas e usuários com papel e permissão bem definidos",
      "Isolamento de dado por empresa aplicado no banco, não só na tela",
    ],
  },
  {
    titulo: "Solicitante",
    descricao: "Quem abre o chamado.",
    beneficios: [
      "Portal próprio, separado da área interna da equipe de suporte",
      "Acompanha o chamado do início ao fim, sem precisar perguntar status",
      "Avalia o atendimento por um link direto, sem precisar fazer login",
    ],
  },
] as const

export const DOR_VIRADA = {
  titulo: "Sua equipe já passou por isso?",
  pares: [
    {
      antes: "O prazo continua correndo enquanto você espera o cliente responder",
      depois: "Pausar ou aguardar aprovação congela o relógio de verdade",
    },
    {
      antes: "Toda abertura de chamado exige decidir a prioridade na hora",
      depois: "O chamado nasce sem prioridade — os prazos recalculam quando ela é definida",
    },
    {
      antes: "Uma planilha só, compartilhada entre empresas diferentes",
      depois: "Isolamento de dado por empresa aplicado no banco, não na interface",
    },
    {
      antes: "O quadro está desatualizado assim que alguém move um card",
      depois: "Kanban em tempo real — todo mundo vê a mesma coisa, ao mesmo tempo",
    },
  ],
  virada: "Prazo apertado é difícil de administrar. O Aegis torna isso simples.",
} as const

export const PILARES = [
  {
    titulo: "Entenda a pausa",
    descricao:
      "O SLA para de verdade quando o chamado está pausado ou aguardando aprovação, e retoma somando os minutos úteis parados.",
  },
  {
    titulo: "Organize-se em tempo real",
    descricao:
      "Kanban colaborativo: mudanças aparecem para toda a equipe assim que acontecem, sem recarregar nada.",
  },
  {
    titulo: "Isole por empresa",
    descricao:
      "A separação de dado entre empresas-clientes é aplicada no próprio banco — não depende de nenhum filtro na tela.",
  },
] as const

export const COMO_FUNCIONA = [
  {
    titulo: "Abre",
    descricao:
      "Pelo portal do cliente ou pela área interna, com categoria e anexos — cada chamado nasce sem prioridade definida.",
    mockup: "portal",
  },
  {
    titulo: "Prioriza",
    descricao:
      "Ao definir a prioridade, os prazos de resposta e solução recalculam a partir do momento da abertura.",
    mockup: "chamado",
  },
  {
    titulo: "Atende",
    descricao:
      "Fila e Kanban em tempo real, com timeline e apontamento de horas. Pausar ou aguardar aprovação congela o relógio do SLA.",
    mockup: "sla-pausa",
  },
  {
    titulo: "Fecha e mede",
    descricao:
      "Ao finalizar, o solicitante recebe um link de avaliação com token próprio — sem precisar fazer login para responder.",
    mockup: "avaliacao",
  },
] as const

export const RECAP = {
  titulo: "Se você chegou até aqui, você quer:",
  itens: [
    "Um prazo de SLA que reflete o tempo real de trabalho, não o relógio corrido",
    "Uma fila que a equipe inteira vê atualizada, sem F5",
    "Dado de cliente separado por empresa, garantido pelo banco",
    "Um portal simples para quem abre o chamado, sem treinamento",
  ],
} as const

export const FAQ = [
  {
    pergunta: "O expediente do SLA é configurável?",
    resposta: "Hoje é fixo: 09:00 às 18:00, de segunda a sexta.",
  },
  {
    pergunta: "O que exatamente congela o prazo de SLA?",
    resposta:
      "Colocar o chamado como pausado ou aguardando aprovação. Ao retomar, o sistema soma de volta os minutos úteis que ficaram parados.",
  },
  {
    pergunta: "Os 6 status são fixos?",
    resposta: "Não — sua empresa liga, desliga e renomeia cada um deles.",
  },
  {
    pergunta: "Como o dado de uma empresa fica separado do de outra?",
    resposta:
      "Por políticas de segurança aplicadas no próprio banco de dados (RLS), não por um filtro na tela — mesmo uma consulta sem filtro explícito só retorna o que aquele papel pode ver.",
  },
  {
    pergunta: "Quem consegue ver o quê?",
    resposta:
      "Três papéis: admin e analista veem chamados de todas as empresas; solicitante só vê os da própria empresa, no portal separado.",
  },
  {
    pergunta: "O Aegis tem IA ou chatbot?",
    resposta: "Não, e isso não está no roteiro atual.",
  },
  {
    pergunta: "O sistema manda e-mail quando um chamado muda?",
    resposta: "Ainda não — e-mail transacional está no roteiro, mas não foi entregue.",
  },
  {
    pergunta: "Tem dashboard, relatório ou exportação?",
    resposta:
      "Tem. Dashboard com métricas por analista e por empresa — total, abertos, finalizados, tempo médio de resposta e de solução, e % de cumprimento de SLA — e exportação em CSV, na área da equipe.",
  },
  {
    pergunta: "Atende WhatsApp, telefone ou tem base de conhecimento?",
    resposta: "Não. O Aegis hoje é focado em chamado, SLA e Kanban.",
  },
] as const

export const CTA_FINAL = {
  titulo: "O prazo do seu help desk já está correndo.",
  subtitulo: "Entre e veja a fila da sua equipe organizada em tempo real.",
} as const
