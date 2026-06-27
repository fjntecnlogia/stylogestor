/**
 * STYLOGESTOR — PM2 ecosystem config (fonte da verdade da prod)
 *
 * Usado pelo `infra/vps/deploy-pm2.sh` pra (re)configurar os 5 processos
 * com cwd, comando e porta corretos a cada deploy. Sem isso, se a config
 * do PM2 for perdida (reboot, pm2 kill), volta ao zero.
 *
 * Mapeamento de portas (alinhado com o servidor web/CDN da Hostinger):
 *   - stylo-web      → 3000  (app.stylogestor.com.br)
 *   - stylo-api      → 3001  (api.stylogestor.com.br) — cluster 2 instâncias
 *   - stylo-site     → 3002  (stylogestor.com.br)
 *   - stylo-booking  → 3003  (booking.stylogestor.com.br)
 *   - stylo-admin    → 3004  (admin.stylogestor.com.br)
 */
// Usa 'pnpm start' (simples, igual a API que já funciona em cluster) +
// PORT via env var. Next.js lê process.env.PORT por default — sem
// precisar passar -p na CLI. Evita o bug do 'pnpm exec' não achar 'next'
// no PATH do PM2 daemon (que tem env mínimo).
module.exports = {
  apps: [
    {
      name: 'stylo-web',
      cwd: '/opt/stylogestor/apps/web',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3000' },
    },
    {
      name: 'stylo-api',
      cwd: '/opt/stylogestor/packages/api',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'cluster',
      instances: 2,
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3001' },
    },
    {
      name: 'stylo-site',
      cwd: '/opt/stylogestor/apps/site',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3002' },
    },
    {
      name: 'stylo-booking',
      cwd: '/opt/stylogestor/apps/booking',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3003' },
    },
    {
      name: 'stylo-admin',
      cwd: '/opt/stylogestor/apps/admin',
      script: 'pnpm',
      args: 'start',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1024M',
      env: { NODE_ENV: 'production', PORT: '3004' },
    },
  ],
}
