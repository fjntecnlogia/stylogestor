import { NextResponse } from 'next/server'

const ULTRA_INSTANCE = process.env.ULTRAMSG_INSTANCE || ''
const ULTRA_TOKEN    = process.env.ULTRAMSG_TOKEN    || ''
const ULTRA_BASE     = `https://api.ultramsg.com/${ULTRA_INSTANCE}`

// GET /api/whatsapp/qr — status e QR code da Ultra MSG
export async function GET() {
  if (!ULTRA_INSTANCE || !ULTRA_TOKEN) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Configure ULTRAMSG_INSTANCE e ULTRAMSG_TOKEN no .env',
      setup_url: 'https://app.ultramsg.com',
    })
  }

  try {
    // Verificar status da instância
    const statusRes = await fetch(
      `${ULTRA_BASE}/instance/status?token=${ULTRA_TOKEN}`,
      { cache: 'no-store' }
    )
    const status = await statusRes.json()

    if (status?.status?.accountStatus?.status === 'authenticated') {
      return NextResponse.json({
        status: 'connected',
        phone: status?.status?.accountInfo?.Wid ?? '',
      })
    }

    // Pegar QR code
    const qrRes = await fetch(
      `${ULTRA_BASE}/instance/qr?token=${ULTRA_TOKEN}`,
      { cache: 'no-store' }
    )
    const qrData = await qrRes.json()

    if (qrData?.qrCode) {
      return NextResponse.json({
        status: 'qr',
        qrcode: qrData.qrCode, // já vem como data:image/png;base64,...
      })
    }

    return NextResponse.json({
      status: 'disconnected',
      message: 'Instância não conectada. Acesse app.ultramsg.com para escanear o QR.',
    })
  } catch (err) {
    console.error('[ULTRAMSG_QR_ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — não necessário com Ultra MSG (QR é gerado no painel deles)
export async function POST() {
  return NextResponse.json({ message: 'Acesse app.ultramsg.com para conectar o WhatsApp' })
}
