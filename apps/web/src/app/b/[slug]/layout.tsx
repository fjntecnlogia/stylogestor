import { ToastProvider } from '@/components/ui/toast'

/**
 * /b/[slug] é landing pública — fora do (dashboard) que tem ToastProvider.
 * Esse layout local garante que o BookingPublicFlow possa usar useToast.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
