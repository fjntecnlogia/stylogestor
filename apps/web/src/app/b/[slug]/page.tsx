import { BookingPublicFlow } from '@/components/booking/booking-public-flow'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BookingPublicPage({ params }: Props) {
  const { slug } = await params
  return <BookingPublicFlow slug={slug} />
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `Agendar — ${slug}`,
    description: 'Reserve seu horário online',
  }
}
