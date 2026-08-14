import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Testes usam o mesmo alias `@/` que o Next.js resolve via tsconfig.json
// (paths: "@/*" -> "./*") — sem isso, qualquer módulo em lib/ que importe
// de "@/..." (não só tipos) falha só sob vitest, nunca em `next dev`/build.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
