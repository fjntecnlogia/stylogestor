import type { NextConfig } from "next";

// VPS usa PM2 + `next start` (não Docker standalone).
// Standalone movia .next/static pra caminho que `next start` não acha → CSS quebrado.
const nextConfig: NextConfig = {};

export default nextConfig;
