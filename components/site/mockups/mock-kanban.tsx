import { BrowserChrome } from "@/components/site/browser-chrome"
import { MockAvatar, MockPrioridade, MockSemPrioridade, MockSla } from "@/components/site/mockups/pecas"

interface CardFicticio {
  numero: string
  titulo: string
  empresa: string
  prioridade?: { rotulo: string; cor: string }
  sla?: { rotulo: string; tempo: string; cor: string }
  avatar: string
}

const COLUNAS: { titulo: string; cards: CardFicticio[] }[] = [
  {
    titulo: "A fazer",
    cards: [
      { numero: "#1042", titulo: "Impressora não conecta na rede", empresa: "Contoso Ltda", avatar: "AN" },
      {
        numero: "#1041",
        titulo: "Acesso ao sistema financeiro",
        empresa: "Northwind",
        prioridade: { rotulo: "Alta", cor: "var(--status-aguardando-solid)" },
        avatar: "JS",
      },
    ],
  },
  {
    titulo: "Em andamento",
    cards: [
      {
        numero: "#1038",
        titulo: "Migração de e-mail corporativo",
        empresa: "Fabrikam",
        sla: { rotulo: "", tempo: "02h14", cor: "var(--sla-atencao)" },
        avatar: "MR",
      },
    ],
  },
  {
    titulo: "Pausado",
    cards: [
      {
        numero: "#1035",
        titulo: "Configuração de VPN para filial",
        empresa: "Contoso Ltda",
        sla: { rotulo: "", tempo: "Pausado", cor: "var(--sla-pausado)" },
        avatar: "AN",
      },
    ],
  },
]

export function MockKanban() {
  return (
    <BrowserChrome
      label="Prévia do Kanban de chamados: colunas A fazer, Em andamento e Pausado, com prioridade e SLA visíveis em cada card"
      url="aegis.app/chamados?view=kanban"
    >
      <div className="flex gap-3 overflow-x-auto pb-1">
        {COLUNAS.map((coluna) => (
          <div key={coluna.titulo} className="flex w-52 shrink-0 flex-col gap-2">
            <p className="px-1 text-xs font-semibold text-muted-foreground">{coluna.titulo}</p>
            {coluna.cards.map((card) => (
              <div
                key={card.numero}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface p-(--card-pad) text-sm shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-tabular text-xs text-muted-foreground">{card.numero}</span>
                  {card.prioridade ? (
                    <MockPrioridade rotulo={card.prioridade.rotulo} cor={card.prioridade.cor} />
                  ) : (
                    <MockSemPrioridade />
                  )}
                </div>
                <p className="line-clamp-2 font-medium text-foreground">{card.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{card.empresa}</p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <MockAvatar iniciais={card.avatar} />
                  {card.sla ? <MockSla rotulo={card.sla.rotulo} tempo={card.sla.tempo} cor={card.sla.cor} /> : <span />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </BrowserChrome>
  )
}
