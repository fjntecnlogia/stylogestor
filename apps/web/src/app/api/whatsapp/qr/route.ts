import { NextResponse } from 'next/server'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8181'
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'stylogestor'

async function evoFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

// Extrair base64 do QR de qualquer formato da Evolution API
function extractQR(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  // v2 formats
  if (typeof d.base64 === 'string') return d.base64
  if (d.qrcode && typeof d.qrcode === 'object') {
    const qr = d.qrcode as Record<string, unknown>
    if (typeof qr.base64 === 'string') return qr.base64
  }
  // outras estruturas
  if (typeof d.qr === 'string') return d.qr
  return null
}

// GET /api/whatsapp/qr
export async function GET() {
  if (!EVOLUTION_KEY) {
    return NextResponse.json({ error: 'EVOLUTION_API_KEY não configurado' }, { status: 503 })
  }
  try {
    // Verifica estado
    const state = await evoFetch(`/instance/connectionState/${INSTANCE}`)
    console.log('[WA_STATE]', JSON.stringify(state))

    const stateVal = state?.instance?.state ?? state?.state ?? ''
    if (stateVal === 'open') {
      return NextResponse.json({ status: 'connected', state: 'open' })
    }

    // Solicita QR code
    const qr = await evoFetch(`/instance/connect/${INSTANCE}`)
    console.log('[WA_QR]', JSON.stringify(qr)?.slice(0, 200))

    const qrcode = extractQR(qr)
    return NextResponse.json({ status: 'qr', qrcode, state: stateVal, raw: !qrcode ? qr : undefined })
  } catch (err) {
    console.error('[WA_QR_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/whatsapp/qr → cria instância se não existir
export async function POST() {
  if (!EVOLUTION_KEY) {
    return NextResponse.json({ error: 'EVOLUTION_API_KEY não configurado' }, { status: 503 })
  }
  try {
    try {
      await evoFetch('/instance/create', 'POST', {
        instanceName: INSTANCE,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      })
    } catch { /* já existe */ }

    const qr = await evoFetch(`/instance/connect/${INSTANCE}`)
    console.log('[WA_POST_QR]', JSON.stringify(qr)?.slice(0, 200))
    const qrcode = extractQR(qr)
    return NextResponse.json({ status: 'qr', qrcode })
  } catch (err) {
    console.error('[WA_INIT_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
