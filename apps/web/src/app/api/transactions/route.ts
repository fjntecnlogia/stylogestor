import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@stylogestor/database'
import { getCurrentTenantId } from '@/lib/auth-tenant'

type TransactionType = 'INCOME' | 'EXPENSE'
type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'OTHER'

const VALID_METHODS = new Set<PaymentMethod>([
  'CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'OTHER',
])

function normalizeMethod(raw: string | undefined): PaymentMethod | null {
  if (!raw) return null
  const upper = raw.toUpperCase()
  if (VALID_METHODS.has(upper as PaymentMethod)) return upper as PaymentMethod
  const map: Record<string, PaymentMethod> = {
    'DINHEIRO': 'CASH',
    'CARTÃO':   'CREDIT_CARD',
    'CARTAO':   'CREDIT_CARD',
    'CREDITO':  'CREDIT_CARD',
    'DEBITO':   'DEBIT_CARD',
  }
  return map[upper] ?? 'OTHER'
}

/**
 * POST /api/transactions
 * Body: { type: 'INCOME'|'EXPENSE', amount, description, category?, paymentMethod?, date? }
 *
 * Cria Transaction manual no financeiro do gestor. Útil pra registrar
 * despesas (luz, aluguel, produtos, comissões) ou entradas avulsas
 * (vendas de produto, gorjetas, etc).
 */
export async function POST(req: NextRequest) {
  const tenantId = await getCurrentTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  try {
    const body = await req.json()
    const { type, amount, description, category, paymentMethod, date } = body as {
      type?: TransactionType; amount?: number; description?: string
      category?: string; paymentMethod?: string; date?: string
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json({ error: 'type deve ser INCOME ou EXPENSE' }, { status: 400 })
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount deve ser positivo' }, { status: 400 })
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: 'description é obrigatório' }, { status: 400 })
    }

    const created = await prisma.transaction.create({
      data: {
        tenantId,
        type,
        category: category ?? (type === 'INCOME' ? 'Outros' : 'Despesa'),
        description: description.trim(),
        amount,
        date: date ? new Date(date) : new Date(),
        paymentMethod: normalizeMethod(paymentMethod),
        status: 'confirmed',
      },
    })

    return NextResponse.json({
      id: created.id,
      type: created.type,
      desc: created.description,
      cat: created.category,
      method: created.paymentMethod ?? 'OUTROS',
      amount: Number(created.amount),
      date: created.date.toLocaleDateString('pt-BR'),
      time: created.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })
  } catch (err) {
    console.error('[TRANSACTIONS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Erro ao registrar movimentação' }, { status: 500 })
  }
}
