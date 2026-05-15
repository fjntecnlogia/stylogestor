import { NextRequest, NextResponse } from 'next/server'

// ── Store em memória para o QR code ────────────────────────────
// Persiste enquanto o processo Node.js está rodando
declare global {
  // eslint-disable-next-line no-var
  var __waQRCode: string | null
  // eslint-disable-next-line no-var
  var __waStatus: string
  // eslint-disable-next-line no-var
  var __waQRAt: number
}

globalThis.__waQRCode  = globalThis.__waQRCode  ?? null
globalThis.__waStatus  = globalThis.__waStatus  ?? 'disconnected'
globalThis.__waQRAt    = globalThis.__waQRAt    ?? 0

// POST /api/whatsapp/webhook — recebe eventos da Evolution API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = body.event ?? body.type ?? ''

    console.log('[WA_WEBHOOK]', event, JSON.stringify(body)?.slice(0, 200))

    // QR Code gerado
    if (event === 'QRCODE_UPDATED' || event === 'qrcode.updated') {
      const qr = body.data?.qrcode?.base64 ?? body.data?.base64 ?? body.qrcode?.base64 ?? body.base64
      if (qr) {
        globalThis.__waQRCode = qr
        globalThis.__waStatus = 'qr'
        globalThis.__waQRAt   = Date.now()
        console.log('[WA_WEBHOOK] QR code recebido e armazenado')
      }
    }

    // Status de conexão mudou
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      const state = body.data?.state ?? body.state ?? ''
      console.log('[WA_WEBHOOK] Connection state:', state)
      if (state === 'open' || state === 'OPEN') {
        globalThis.__waQRCode  = null
        globalThis.__waStatus  = 'connected'
      } else if (state === 'close' || state === 'CLOSED') {
        globalThis.__waStatus  = 'disconnected'
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WA_WEBHOOK_ERROR]', err)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

// GET /api/whatsapp/webhook — consultar QR code atual (polling do frontend)
export async function GET() {
  const qr    = globalThis.__waQRCode
  const status = globalThis.__waStatus
  const age   = Date.now() - globalThis.__waQRAt

  // QR expira em 60 segundos
  if (qr && age > 60000) {
    globalThis.__waQRCode = null
    globalThis.__waStatus = 'disconnected'
    return NextResponse.json({ status: 'expired', qrcode: null })
  }

  return NextResponse.json({ status: qr ? 'qr' : status, qrcode: qr })
}
