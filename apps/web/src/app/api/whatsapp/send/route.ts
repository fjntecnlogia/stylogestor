import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { phone, message } = await req.json()
    if (!phone || !message) return NextResponse.json({ error: 'phone e message são obrigatórios' }, { status: 400 })

    const ok = await sendWhatsApp({ phone, message })
    if (!ok) return NextResponse.json({ error: 'Falha ao enviar mensagem' }, { status: 500 })

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('[WHATSAPP_SEND_ERROR]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
