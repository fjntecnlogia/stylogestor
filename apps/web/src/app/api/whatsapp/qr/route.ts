import { NextResponse } from 'next/server'

const ZAPI_INSTANCE     = process.env.ZAPI_INSTANCE_ID    || ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN           || ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN    || ''
const ZAPI_BASE         = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`

// GET /api/whatsapp/qr — status da conexão Z-API
export async function GET() {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN no .env',
      setup_url: 'https://app.z-api.io',
    })
  }

  try {
    const res = await fetch(`${ZAPI_BASE}/status`, {
      headers: ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {},
      cache: 'no-store',
    })
    const data = await res.json()

    if (data.connected) {
      return NextResponse.json({ status: 'connected', phone: data.smartphoneConnected })
    }

    // Pegar QR code
    const qrRes = await fetch(`${ZAPI_BASE}/qr-code/image`, {
      headers: ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {},
      cache: 'no-store',
    })

    if (qrRes.ok) {
      const qrData = await qrRes.json()
      return NextResponse.json({
        status: 'qr',
        qrcode: qrData.value, // base64 da imagem
      })
    }

    return NextResponse.json({ status: 'disconnected', message: 'Conecte no app.z-api.io' })
  } catch (err) {
    console.error('[ZAPI_QR_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
