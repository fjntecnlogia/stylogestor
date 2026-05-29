import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendTrialExpiringEmail,
  sendAppointmentConfirmationEmail,
} from '@/lib/resend'

export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { type, to, data } = body

  if (!type || !to) {
    return NextResponse.json({ error: 'type e to são obrigatórios' }, { status: 400 })
  }

  let ok = false
  switch (type) {
    case 'welcome':
      ok = await sendWelcomeEmail(to, data?.name ?? 'Cliente')
      break
    case 'trial_expiring':
      ok = await sendTrialExpiringEmail(to, data?.name ?? 'Cliente', data?.daysLeft ?? 3)
      break
    case 'appointment_confirmation':
      ok = await sendAppointmentConfirmationEmail(
        to,
        data?.clientName ?? '',
        data?.date ?? '',
        data?.time ?? '',
        data?.service ?? '',
        data?.professional ?? '',
        data?.barbershop ?? '',
      )
      break
    default:
      return NextResponse.json({ error: `Tipo '${type}' não suportado` }, { status: 400 })
  }

  return NextResponse.json({ ok })
}
