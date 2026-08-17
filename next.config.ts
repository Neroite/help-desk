import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem isso o Next detecta a raiz do workspace errado (há outro
  // package-lock.json em Ticket/, fora desta worktree) e o Turbopack passa
  // a observar a árvore inteira do repositório pai — incluindo o checkout
  // principal e as demais worktrees em .claude/worktrees/ — em vez de só
  // esta pasta. Isso incha o watch/rebuild do dev server sem nenhum
  // benefício, e é um dos suspeitos prováveis da lentidão reportada.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
