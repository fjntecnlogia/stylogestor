import { NextResponse } from 'next/server'

const EVOLUTION_URL      = process.env.EVOLUTION_API_URL  || 'http://localhost:8080'
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY  || ''
const INSTANCE           = process.env.EVOLUTION_INSTANCE || 'stylogestor'

async function evoFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error(`Evolution API ${res.status}: ${await res.text()}`)
  return res.json()
}

// GET /api/whatsapp/qr → retorna QR code base64 ou status
export async function GET() {
  if (!EVOLUTION_KEY) {
    return NextResponse.json({ error: 'EVOLUTION_API_KEY não configurado' }, { status: 503 })
  }
  try {
    // Verifica estado da instância
    const state = await evoFetch(`/instance/connectionState/${INSTANCE}`)
    if (state?.instance?.state === 'open') {
      return NextResponse.json({ status: 'connected', state: 'open' })
    }
    // Solicita QR code
    const qr = await evoFetch(`/instance/connect/${INSTANCE}`)
    return NextResponse.json({
      status: 'qr',
      qrcode: qr?.base64 ?? qr?.qrcode?.base64 ?? null,
      state: state?.instance?.state ?? 'disconnected',
    })
  } catch (err) {
    console.error('[WA_QR_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/whatsapp/qr → cria/reinicia instância
export async function POST() {
  if (!EVOLUTION_KEY) {
    return NextResponse.json({ error: 'EVOLUTION_API_KEY não configurado' }, { status: 503 })
  }
  try {
    // Tenta criar instância se não existir
    try {
      await evoFetch('/instance/create', 'POST', {
        instanceName: INSTANCE,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      })
    } catch {
      // Instância já existe — ok
    }
    // Solicita QR
    const qr = await evoFetch(`/instance/connect/${INSTANCE}`)
    return NextResponse.json({
      status: 'qr',
      qrcode: qr?.base64 ?? qr?.qrcode?.base64 ?? null,
    })
  } catch (err) {
    console.error('[WA_INIT_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
