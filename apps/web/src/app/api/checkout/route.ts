import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, ciclo, email } = body

    if (!plan || !ciclo || !email) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Chama o backend NestJS para criar a sessão Stripe
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const tenantSlug = req.headers.get('x-tenant-slug') || ''

    const res = await fetch(`${apiUrl}/api/v1/subscriptions/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
        'x-stylo-tenant': tenantSlug,
      },
      body: JSON.stringify({ plan, ciclo, email }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message || 'Erro ao criar checkout' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
