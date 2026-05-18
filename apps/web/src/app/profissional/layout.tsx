import { ProfissionalShell } from '@/components/profissional/profissional-shell'
import { ToastProvider } from '@/components/ui/toast'

export default function ProfissionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ProfissionalShell>{children}</ProfissionalShell>
    </ToastProvider>
  )
}
