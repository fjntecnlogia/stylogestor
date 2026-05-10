import { BookingFlow } from '@/components/booking-flow'

export default function BookingPage() {
  // Em produção, o slug vem do subdomínio via headers (middleware)
  return <BookingFlow slug="demo" />
}
