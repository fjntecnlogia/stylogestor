import path from 'path'
import type { NextConfig } from "next";

// `output: 'standalone'` é necessário pro Dockerfile do admin funcionar
// (cria .next/standalone/ que o Docker copia). Não quebra PM2: `next start`
// continua lendo o .next/ normal — o standalone é só um bundle extra.
// `outputFileTracingRoot` aponta pra raiz do monorepo pra incluir
// packages/database no tracing do standalone.
const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
