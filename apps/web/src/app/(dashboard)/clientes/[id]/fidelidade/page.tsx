import { FidelidadeView } from '@/components/fidelidade/fidelidade-view'

export const metadata = { title: 'Fidelidade do Cliente — STYLOGESTOR' }

export default function FidelidadePage({ params }: { params: { id: string } }) {
  return <FidelidadeView clientId={params.id} />
}
