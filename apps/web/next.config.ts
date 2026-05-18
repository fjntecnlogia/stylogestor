import type { NextConfig } from "next";

// Nota: o ambiente atual da VPS usa PM2 + `next start` (não Docker standalone).
// Se voltarmos a usar Docker no futuro, reativar `output: "standalone"` +
// `outputFileTracingRoot` apontando pra raiz do monorepo, E garantir que o
// Dockerfile copia `.next/static` e `public` pra dentro do standalone.
const nextConfig: NextConfig = {};

export default nextConfig;
