import type { CSSProperties } from "react"

function gerarCaminhos(position: number) {
  return Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    // Bem mais fino que o componente de referência: preserveAspectRatio
    // "none" estica o viewBox (~1.8x na horizontal) e engrossa o traço
    // junto.
    width: 0.4 + i * 0.02,
    // Já embutida a atenuação que antes era um opacity-60 no wrapper em
    // hero.tsx. Opacidade de GRUPO obriga o navegador a compor os 36
    // traços num buffer fora da tela e reaplicar 60% a cada frame em que
    // eles mudam; por traço é só uma cor a mais no stroke, custo zero.
    // Muito mais apagada que a referência porque os 72 caminhos mostram
    // traço o tempo todo (32% de tinta, ver site.css), então ela acumula —
    // nos valores originais o fundo cobria o texto.
    opacity: 0.025 + i * 0.006,
    // Duração de um ciclo, que percorre um período do dasharray (0.25), e
    // não a curva inteira: uma travessia completa leva 4x isto, 12 a 20s.
    duracao: 3 + i * 0.06,
    // Atraso negativo: cada curva já nasce num ponto diferente do ciclo,
    // então o conjunto nunca pulsa em uníssono. Passo de 0.7s contra ciclos
    // de 3 a 5s embaralha a fase entre curvas vizinhas; um passo pequeno
    // faria o contrário — uma frente de onda varrendo o bloco.
    atraso: i * 0.7,
    // Só usada quando a animação está desligada (prefers-reduced-motion).
    // Sem ela os 72 caminhos congelam todos na fase 0 e os traços se
    // alinham em faixas densas; o passo de 0.07 dentro do período de 0.25
    // reproduz estaticamente o embaralhamento que o atraso faz no tempo.
    fase: Number(((i * 0.07) % 0.25).toFixed(4)),
  }))
}

// Linhas de fundo do Hero, puramente decorativas — quem chama marca o
// wrapper aria-hidden.
//
// A animação é CSS puro, e isso é o ponto central do arquivo. Três versões
// anteriores animaram os <path> via Motion (pathLength/pathOffset, depois
// opacity) e as três fizeram a página piscar em todo navegador: Motion
// interpola na main thread e escreve estilo inline nos 72 traços a cada
// frame, o que estoura o orçamento e derruba o frame rate — e dash animando
// a frame rate baixo lê como pisca-pisca, não como lentidão.
//
// Em CSS, quem interpola é o motor de animação do navegador, fora da main
// thread do React. Sem hook e sem Motion o componente ainda deixa de ser
// client component: nenhum KB de JS vai pro cliente por causa deste fundo,
// e some junto o swap <path> -> <motion.path> na hidratação.
//
// prefers-reduced-motion não precisa de hook: está tratado em site.css.
export function FloatingPaths({ position }: { position: number }) {
  const caminhos = gerarCaminhos(position)

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* preserveAspectRatio="none": as curvas vão de y=-189 a y=875 num
          viewBox de 316 de altura, então "slice" as ampliaria muito numa
          faixa larga e baixa como o Hero. "none" estica o viewBox pro
          tamanho exato do contêiner — preenche igual, sem ampliar. */}
      <svg
        className="h-full w-full text-primary"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="none"
      >
        {caminhos.map((caminho) => (
          <path
            key={caminho.id}
            className="traco-fluxo"
            d={caminho.d}
            // pathLength=1 normaliza o comprimento da curva, o que deixa
            // dasharray/dashoffset em site.css serem fração dela (0.3 = 30%)
            // em vez de dependerem do comprimento real de cada caminho.
            pathLength={1}
            stroke="currentColor"
            strokeWidth={caminho.width}
            strokeOpacity={caminho.opacity}
            style={
              {
                "--traco-dur": `${caminho.duracao}s`,
                "--traco-atraso": `-${caminho.atraso}s`,
                "--traco-fase": caminho.fase,
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  )
}
