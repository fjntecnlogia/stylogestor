import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { requireAdmin } from '@/lib/require-admin'

/**
 * GET /api/logs — lista eventos do system_logs (paginado + filtrável).
 *
 * Query params:
 *   - level: 'info' | 'warn' | 'error' | 'debug' (opcional)
 *   - source: filtro exato ou prefixo (LIKE source%) — opcional
 *   - tenantId: UUID (opcional)
 *   - limit: 1-500 (default 100)
 *   - cursor: id do último item da página anterior (paginação keyset)
 *
 * Retorna: { items: [...], nextCursor: string | null }
 * Ordem: mais recente primeiro (createdAt DESC).
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const url = req.nextUrl
  const level = url.searchParams.get('level')
  const source = url.searchParams.get('source')
  const tenantId = url.searchParams.get('tenantId')
  const cursor = url.searchParams.get('cursor')
  const limitRaw = Number(url.searchParams.get('limit') ?? 100)
  const limit = Math.min(Math.max(limitRaw, 1), 500)

  try {
    const where: Record<string, unknown> = {}
    if (level && ['info', 'warn', 'error', 'debug'].includes(level)) {
      where.level = level
    }
    if (source) {
      // prefix match — útil pra "api/" pegar todas as rotas
      where.source = { startsWith: source }
    }
    if (tenantId) {
      where.tenantId = tenantId
    }

    const items = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // 1 extra pra saber se tem próxima página
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = items.length > limit
    const page = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? page[page.length - 1].id : null

    return NextResponse.json({ items: page, nextCursor })
  } catch (err) {
    console.error('[ADMIN_LOGS_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
  }
}

/**
 * DELETE /api/logs — limpa logs antigos (retention manual).
 *
 * Query param `olderThanDays` (default 30) — apaga tudo mais velho que X dias.
 * Útil quando a tabela cresce demais. Em prod, idealmente um cron faz isso
 * sozinho. Por enquanto o admin pode chamar manual via UI.
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const olderThanDays = Number(req.nextUrl.searchParams.get('olderThanDays') ?? 30)
  if (!Number.isFinite(olderThanDays) || olderThanDays < 1) {
    return NextResponse.json({ error: 'olderThanDays inválido' }, { status: 400 })
  }

  try {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    const { count } = await prisma.systemLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
    return NextResponse.json({ ok: true, deleted: count, cutoff })
  } catch (err) {
    console.error('[ADMIN_LOGS_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 })
  }
}
