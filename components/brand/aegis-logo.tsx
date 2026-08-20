interface AegisLogoProps {
  className?: string
}

// Escudo angular Aegis: contorno de escudo (ombros angulados, base em ponta)
// com a letra "A" desenhada por dentro, concêntrica -- segunda aproximação à
// mão da referência (Gemini_Generated_Image_.jpg, não um vetor original),
// refinada lado a lado com a referência via captura de tela antes de ser
// aplicada aqui. O contorno usa currentColor pra herdar a cor do contexto
// (sidebar escura, login claro); o acento laranja -- um estilhaço fino que
// substitui parte da borda direita do escudo, não um triângulo solto -- usa
// --brand-accent, fixo entre os temas. Sem vetor original, não é
// pixel-perfeito; se precisar de fidelidade exata, importar os paths de um
// SVG/AI/PDF exportado da referência em vez de redesenhar de novo à mão.
export function AegisLogo({ className }: AegisLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M30.5 6 L20 12 L15 28 L30.5 60"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M33.5 6 L44 12 L49 28 L41.5 43"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M32 17 L23 50"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path
        d="M32 17 L37.5 37"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path
        d="M25.5 39 L36 39"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path d="M41.5 43 L49 28 L46.5 41 L45.5 55 L33.5 60 Z" fill="var(--brand-accent)" />
    </svg>
  )
}
