import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo pnpm: tracing precisa olhar a raiz pra capturar packages siblings.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
