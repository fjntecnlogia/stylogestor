/**
 * Migração one-time: Clerk (web) → Supabase Auth (Fase 3 da unificação).
 *
 * Cria, no MESMO projeto Supabase que o mobile já usa, uma conta para cada
 * usuário existente no Clerk, e linka `User.supabaseId` por email. A partir daí
 * o web pode autenticar no Supabase (mesma base do app) → login único.
 *
 * ⚠️ Os usuários migrados NÃO têm senha no Supabase (a senha do Clerk não é
 *    exportável). Eles definem uma no 1º acesso via "esqueci a senha" (ou
 *    disparo de reset em massa). Por isso usamos `email_confirm: true`
 *    (não reenvia e-mail de confirmação) e NÃO criamos senha aqui.
 *
 * Idempotente: rodar de novo reaproveita contas já existentes no Supabase e
 * só linka quem falta. Comece SEMPRE pelo dry-run.
 *
 * Uso:
 *   pnpm --filter @stylogestor/api run migrate:clerk-supabase -- --dry-run
 *   pnpm --filter @stylogestor/api run migrate:clerk-supabase            # real
 *
 * Requer em packages/api/.env:
 *   CLERK_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← chave ADMIN (NÃO use anon/publishable aqui)
 *   DATABASE_URL
 */
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { createClerkClient } from '@clerk/backend'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const DRY_RUN = process.argv.includes('--dry-run')

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`✗ Env ${name} ausente. Abortando.`)
    process.exit(1)
  }
  return v
}

async function main() {
  console.log(
    `\n=== Migração Clerk → Supabase ${DRY_RUN ? '(DRY-RUN — nada será gravado)' : '(REAL)'} ===\n`,
  )

  const clerkSecret = requireEnv('CLERK_SECRET_KEY')
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  requireEnv('DATABASE_URL')

  const clerk = createClerkClient({ secretKey: clerkSecret })
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const prisma = new PrismaClient()

  // 1. Mapa email→supabaseId dos usuários JÁ existentes no Supabase (ex: vindos
  //    do app). Evita tentar recriar e garante o reuso da conta.
  const existingByEmail = new Map<string, string>()
  {
    let page = 1
    const perPage = 1000
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) throw new Error(`listUsers falhou: ${error.message}`)
      for (const u of data.users) {
        if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id)
      }
      if (data.users.length < perPage) break
      page++
    }
  }
  console.log(`Supabase: ${existingByEmail.size} usuário(s) já existente(s).\n`)

  const stats = {
    total: 0,
    created: 0,
    reused: 0,
    linked: 0,
    skippedNoEmail: 0,
    skippedNoUserRow: 0,
    errors: 0,
  }

  // 2. Itera todos os usuários do Clerk (paginado).
  const limit = 100
  let offset = 0
  for (;;) {
    const list = await clerk.users.getUserList({ limit, offset })
    const clerkUsers = list.data
    if (clerkUsers.length === 0) break

    for (const cu of clerkUsers) {
      stats.total++
      const primary =
        cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId) ??
        cu.emailAddresses[0]
      const email = primary?.emailAddress?.toLowerCase()
      const name =
        [cu.firstName, cu.lastName].filter(Boolean).join(' ') || email || 'Usuário'

      if (!email) {
        console.warn(`- [${cu.id}] sem email → pulando`)
        stats.skippedNoEmail++
        continue
      }

      try {
        // 2a. Garante a conta no Supabase Auth.
        let supaId = existingByEmail.get(email)
        if (supaId) {
          stats.reused++
          console.log(`= ${email} já existe no Supabase (${supaId})`)
        } else if (DRY_RUN) {
          console.log(`+ [DRY] criaria no Supabase: ${email}`)
          stats.created++
        } else {
          const { data, error } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true, // Clerk já verificou; não dispara e-mail
            user_metadata: { name },
          })
          if (error || !data.user) {
            throw new Error(`createUser: ${error?.message ?? 'sem user retornado'}`)
          }
          supaId = data.user.id
          existingByEmail.set(email, supaId)
          stats.created++
          console.log(`+ Criado no Supabase: ${email} (${supaId})`)
        }

        // 2b. Linka User.supabaseId no banco (chave = email).
        const userRow = await prisma.user.findUnique({
          where: { email },
          select: { id: true, supabaseId: true },
        })
        if (!userRow) {
          // Sem linha em User: o MultiAuthGuard cria/linka no 1º login Supabase
          // (fallback por email), então não é bloqueante — só registra.
          console.warn(
            `! ${email}: sem linha em User (webhook Clerk não rodou?) → será linkado no 1º login`,
          )
          stats.skippedNoUserRow++
        } else if (userRow.supabaseId) {
          // já linkado anteriormente — nada a fazer
        } else if (supaId && !DRY_RUN) {
          await prisma.user.update({
            where: { id: userRow.id },
            data: { supabaseId: supaId },
          })
          stats.linked++
          console.log(`  ↳ User.supabaseId vinculado (${email})`)
        } else if (supaId && DRY_RUN) {
          console.log(`  ↳ [DRY] vincularia User.supabaseId (${email})`)
          stats.linked++
        }
      } catch (err) {
        stats.errors++
        console.error(`✗ ${email}: ${(err as Error).message}`)
      }
    }

    if (clerkUsers.length < limit) break
    offset += limit
  }

  await prisma.$disconnect()

  console.log(`\n=== Resumo ===`)
  console.table(stats)
  console.log(
    `\nPróximo passo: disparar reset de senha pros usuários migrados (eles não têm senha no Supabase).`,
  )
  console.log(DRY_RUN ? 'DRY-RUN: nada foi gravado.\n' : 'Migração concluída.\n')

  if (stats.errors > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
