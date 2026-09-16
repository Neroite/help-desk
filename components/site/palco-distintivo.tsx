import type { CSSProperties } from "react"

// Anéis concêntricos atrás do distintivo 3D. É o mesmo gesto que o
// ShieldClock já faz mais abaixo na página (components/site/shield-clock.tsx:
// um box-shadow que expande a partir do escudo), trazido para o topo — o
// escudo da marca emitindo. Aqui ele vem PARADO, de propósito: o distintivo
// 3D já gira sozinho o tempo todo, e um segundo movimento em loop atrás dele
// viraria ruído em vez de ênfase. A regra está registrada em
// components/site/secoes/dor-virada-pares.tsx ("sem virar loop ambiente
// permanente"); o único movimento é a entrada, uma vez.
//
// Tudo mora num quadrado de 180% da altura do palco (a altura é a base, nunca
// a largura: o palco é bem mais largo que alto no desktop, e dimensionar por
// largura achataria a relação entre anéis e distintivo justamente na tela
// grande). Os tamanhos abaixo são frações DESSE quadrado — 58/76/96% dele
// equivalem a 104/136/172% da altura do palco.
const ANEIS = [
  { altura: "58%", tinta: 16, atraso: "0.05s" },
  { altura: "76%", tinta: 10, atraso: "0.17s" },
  { altura: "96%", tinta: 5.5, atraso: "0.29s" },
] as const

// Máscara vertical do quadrado: os anéis dissolvem de cima para baixo. Sem
// ela, os anéis maiores passam da base do Hero e o overflow-hidden da seção
// os corta em reta — a mesma linha de emenda com a seção seguinte que o
// degradê de hero.tsx já precisou matar uma vez. De quebra, anel que some
// rumo ao chão lê como cúpula sobre a peça, não como alvo.
const MASCARA_ANEIS = "linear-gradient(180deg, #000 50%, transparent 80%)"

// Entorno do distintivo Aegis 3D: halo, anéis e sombra ambiente. Puramente
// decorativo — quem monta marca o wrapper com aria-hidden.
export function PalcoDistintivo() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute top-1/2 left-1/2 aspect-square h-[180%] -translate-x-1/2 -translate-y-1/2"
        style={{ maskImage: MASCARA_ANEIS, WebkitMaskImage: MASCARA_ANEIS }}
      >
        <div
          className="absolute top-1/2 left-1/2 aspect-square h-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 100%)",
          }}
        />

        {ANEIS.map((anel) => (
          <div
            key={anel.altura}
            // A classe anima o transform inteiro (app/(site)/site.css), então a
            // centralização mora no keyframe e não em -translate-x-1/2: animar
            // transform sobrescreveria as utilitárias de translate e o anel
            // sairia do centro no primeiro frame.
            className="anel-palco absolute top-1/2 left-1/2 aspect-square rounded-full border"
            style={
              {
                height: anel.altura,
                borderColor: `color-mix(in srgb, var(--primary) ${anel.tinta}%, transparent)`,
                "--anel-atraso": anel.atraso,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* A sombra AMBIENTE — a metade que faltava. components/site/
          dispositivos/luz.ts define o modelo de luz do site em duas camadas
          por peça: ambiente (longa, difusa, o "peso" geral) + contato
          (curta, mais escura, o que gruda o objeto no plano), e diz que
          "uma sem a outra é sempre a versão errada". O artefato 3D desenha
          só a de contato, dentro da cena — e por ser desenhada dentro do
          canvas ela termina em corte reto na borda de baixo do iframe, já
          que o FOV vertical da câmera é fixo em graus e não cabe mais nada
          ali embaixo.

          Esta elipse monta a cavalo nessa borda (bottom negativo), então
          pega a sombra exatamente onde ela é cortada e a dissolve em nada.
          O olho lê um apoio contínuo, não uma emenda. Mesmo --site-navy que
          luz.ts usa em todas as sombras do site, não uma cor nova — e fraca
          e larga o bastante para nunca virar uma faixa escura perto da
          seção seguinte, que foi o defeito que o degradê de hero.tsx já
          teve de resolver uma vez. */}
      <div
        className="absolute bottom-[-10%] left-1/2 h-[44%] w-[96%] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--site-navy) 9%, transparent) 0%, transparent 100%)",
        }}
      />
    </div>
  )
}
