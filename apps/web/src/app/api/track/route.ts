import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { createHash } from 'node:crypto'

/**
 * POST /api/track
 *
 * Recebe {path, ip, ua} do middleware do apps/site (site público) e grava
 * em `site_visits` pra alimentar a aba Analytics do admin.
 *
 * Fica no apps/web porque o web já tem @stylogestor/database (prisma).
 * Site chama via URL absoluta pra este endpoint.
 *
 * IP e UA são hasheados (SHA-256 + salt fixo) antes de gravar —
 * sem PII bruto no banco.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HASH_SALT = process.env.TRACK_HASH_SALT || 'stylogestor-analytics-salt-v1'

function hash(input: string): string {
  return createHash('sha256')
    .update(HASH_SALT + '|' + input)
    .digest('hex')
    .slice(0, 32)
}

export async function POST(req: NextRequest) {
  // Header interno — middleware do site sempre envia. Requests externos
  // sem esse header são ignorados (não são erro, só no-op).
  if (req.headers.get('x-internal-track') !== '1') {
    return NextResponse.json({ ok: true }, { status: 202 })
  }

  try {
    const body = await req.json().catch(() => null)
    const path = typeof body?.path === 'string' ? body.path : null
    const ip = typeof body?.ip === 'string' ? body.ip : ''
    const ua = typeof body?.ua === 'string' ? body.ua : ''

    if (!path) {
      return NextResponse.json({ ok: false, error: 'path missing' }, { status: 400 })
    }

    await prisma.siteVisit.create({
      data: {
        path,
        ipHash: ip ? hash(ip) : null,
        uaHash: ua ? hash(ua) : null,
      },
    })

    return NextResponse.json({ ok: true }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  } catch (err) {
    console.error('[TRACK_ERROR]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// CORS pra o site (stylogestor.com.br) poder POST cross-origin do middleware.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, x-internal-track',
    },
  })
}
