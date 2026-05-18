import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone gera .next/standalone com server.js + deps tracadas — usado pelo Dockerfile.
  output: "standalone",
  // Monorepo pnpm: tracing precisa olhar a raiz pra capturar packages siblings.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
