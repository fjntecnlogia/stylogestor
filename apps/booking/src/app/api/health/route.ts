import { NextResponse } from 'next/server'

/**
 * GET /api/health — health check pro painel admin pingar.
 * Endpoint público, sem auth.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      name: 'stylo-booking',
      version: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      now: new Date().toISOString(),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    },
  })
}
