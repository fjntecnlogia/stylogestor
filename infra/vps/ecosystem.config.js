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
module.exports = {
  apps: [
    {
      name: 'stylo-web',
      cwd: '/opt/stylogestor/apps/web',
      script: 'pnpm',
      args: 'exec next start -p 3000',
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
      args: 'exec next start -p 3002',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3002' },
    },
    {
      name: 'stylo-booking',
      cwd: '/opt/stylogestor/apps/booking',
      script: 'pnpm',
      args: 'exec next start -p 3003',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3003' },
    },
    {
      name: 'stylo-admin',
      cwd: '/opt/stylogestor/apps/admin',
      script: 'pnpm',
      args: 'exec next start -p 3004',
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3004' },
    },
  ],
}
