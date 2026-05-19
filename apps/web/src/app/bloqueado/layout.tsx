import { ToastProvider } from '@/components/ui/toast'

/**
 * /bloqueado fica fora do grupo (dashboard), então não herda o ToastProvider
 * do layout do dashboard. Esse layout local resolve — o <PromoCodeInput />
 * usa useToast() e precisa do provider na árvore.
 */
export default function BloqueadoLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
