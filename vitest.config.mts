import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Testes usam o mesmo alias `@/` que o Next.js resolve via tsconfig.json
// (paths: "@/*" -> "./*") — sem isso, qualquer módulo em lib/ que importe
// de "@/..." (não só tipos) falha só sob vitest, nunca em `next dev`/build.
export default defineConfig({
  test: {
    // Sem isto o vitest também coleta os testes das worktrees em
    // .claude/worktrees/ (cópias antigas deste mesmo lib/), inflando a
    // suíte e deixando `npm run test` falhar por causa de código que não
    // é o desta árvore. Mesmo motivo do ignore ".claude/**" no ESLint.
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
