'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface Step {
  /** seletor CSS do elemento a destacar — usa data-tour="<key>" */
  selector: string
  title: string
  body: string
  /** preferência de posicionamento do balão; cai pro topo se não couber */
  placement?: 'top' | 'bottom'
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="greeting"]',
    title: 'Esse é seu painel ✂️',
    body: 'Aqui é a tela inicial do seu sistema. Tudo que importa pro dia aparece nesse painel — pode ficar tranquilo, vou te mostrar os 5 cantos principais.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="quick-actions"]',
    title: 'Ações rápidas',
    body: 'Cadastrar cliente, abrir agenda ou registrar venda em 1 clique. Use sempre que tiver pressa.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="stats"]',
    title: 'Números do dia',
    body: 'Faturamento, agendamentos, ticket médio e clientes do mês. Tudo atualiza sozinho conforme você usa o sistema.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="appointments"]',
    title: 'Agenda de hoje',
    body: 'Lista dos próximos atendimentos. Clique no ✓ pra marcar como concluído (cai no caixa) ou no ✕ pra cancelar.',
    placement: 'top',
  },
  {
    selector: '[data-tour="cashflow"]',
    title: 'Financeiro do dia',
    body: 'Cada atendimento concluído vira uma entrada aqui. Veja entradas, saídas e o lucro do dia em tempo real.',
    placement: 'top',
  },
]

const PADDING = 8 // margem ao redor do elemento destacado
const TOOLTIP_GAP = 12 // espaço entre o balão e o elemento

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Passeio interativo pelo dashboard.
 * - Roda automaticamente na 1ª entrada (publicMetadata.tourCompleted falsy).
 * - Marca como completo via POST /api/me/tour-completed quando fecha.
 * - Spotlight via box-shadow inset gigante (sem precisar mask CSS complexo).
 */
export function DashboardTour() {
  const { user, isLoaded } = useUser()
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)

  // Decide se deve abrir o tour
  useEffect(() => {
    if (!isLoaded || !user) return
    const completed = (user.publicMetadata as { tourCompleted?: boolean })?.tourCompleted
    if (!completed) {
      // Pequeno delay pra dashboard renderizar antes
      const t = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [isLoaded, user])

  // Recalcula posição do elemento destacado a cada step / resize / scroll
  useLayoutEffect(() => {
    if (!active) return
    const step = STEPS[stepIdx]
    if (!step) return

    const update = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null
      if (!el) {
        setTargetRect(null)
        return
      }
      // scrollIntoView pra garantir que o elemento está visível
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      setTargetRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      })
    }

    update()
    // Reposiciona após smooth-scroll terminar
    const t = setTimeout(update, 350)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [active, stepIdx])

  // Trava o scroll do body enquanto o tour está aberto
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])

  const finish = async (skipped = false) => {
    setActive(false)
    try {
      await fetch('/api/me/tour-completed', { method: 'POST' })
      // Refresca o user pra ter publicMetadata atualizado em memória
      await user?.reload?.()
    } catch (err) {
      // Não bloqueia: usuário vai ver o tour de novo no próximo F5, paciência.
      console.error('[tour] falha ao salvar tourCompleted', err)
    }
    if (skipped) {
      // sem-op por enquanto; útil pra telemetria futura
    }
  }

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1)
    else finish()
  }
  const back = () => setStepIdx((i) => Math.max(0, i - 1))

  if (!active) return null

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  // Se o elemento não existe (ex: tela móvel sem aquele card), pula
  if (!targetRect) {
    return (
      <FallbackModal
        title={step.title}
        body={step.body}
        stepIdx={stepIdx}
        total={STEPS.length}
        onBack={back}
        onNext={next}
        onSkip={() => finish(true)}
        isLast={isLast}
      />
    )
  }

  // Posiciona o balão acima ou abaixo do alvo
  const spotlightTop = targetRect.top - PADDING
  const spotlightLeft = targetRect.left - PADDING
  const spotlightW = targetRect.width + PADDING * 2
  const spotlightH = targetRect.height + PADDING * 2

  // Tooltip: tenta o lado preferido; se não couber, inverte
  const TOOLTIP_W = 320
  const TOOLTIP_H_EST = 180
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
  const preferBottom = (step.placement ?? 'bottom') === 'bottom'
  const fitsBottom = spotlightTop + spotlightH + TOOLTIP_GAP + TOOLTIP_H_EST < scrollY + vh
  const placeBelow = preferBottom ? fitsBottom : !((spotlightTop - TOOLTIP_GAP - TOOLTIP_H_EST) > scrollY)

  const tooltipTop = placeBelow
    ? spotlightTop + spotlightH + TOOLTIP_GAP
    : spotlightTop - TOOLTIP_GAP - TOOLTIP_H_EST

  let tooltipLeft = spotlightLeft + spotlightW / 2 - TOOLTIP_W / 2
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, vw - TOOLTIP_W - 16))

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Spotlight — box-shadow inset gigante escurece tudo menos o "buraco" */}
      <div
        className="absolute rounded-2xl pointer-events-auto transition-all duration-300 ease-out"
        style={{
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightW,
          height: spotlightH,
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
          outline: '2px solid rgba(255,255,255,0.6)',
          outlineOffset: '2px',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto bg-white rounded-2xl shadow-2xl border border-[#E8E6E2] p-5 transition-all duration-300"
        style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#1A3A6B] uppercase tracking-wider">
            Passo {stepIdx + 1} de {STEPS.length}
          </span>
          <button
            onClick={() => finish(true)}
            className="text-[#9CA3AF] hover:text-[#4A4A5A] text-sm font-semibold transition-colors"
            aria-label="Pular tour"
          >
            Pular
          </button>
        </div>
        <h3 className="font-sora font-bold text-[#1C1C2E] text-base mb-1.5">{step.title}</h3>
        <p className="text-sm text-[#4A4A5A] leading-relaxed mb-4">{step.body}</p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === stepIdx ? 'bg-[#1A3A6B]' : i < stepIdx ? 'bg-[#1A3A6B]/40' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={back}
            disabled={stepIdx === 0}
            className="text-xs font-semibold text-[#4A4A5A] px-3 py-2 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={next}
            className="bg-[#1A3A6B] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#142d55] transition-colors"
          >
            {isLast ? 'Finalizar 🎉' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal de fallback quando o elemento alvo não está na tela
 * (ex: mobile escondeu um card). Mostra o conteúdo do passo no centro.
 */
function FallbackModal({
  title, body, stepIdx, total, onBack, onNext, onSkip, isLast,
}: {
  title: string; body: string; stepIdx: number; total: number
  onBack: () => void; onNext: () => void; onSkip: () => void; isLast: boolean
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/65 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E6E2] p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#1A3A6B] uppercase tracking-wider">
            Passo {stepIdx + 1} de {total}
          </span>
          <button onClick={onSkip} className="text-[#9CA3AF] hover:text-[#4A4A5A] text-sm font-semibold">
            Pular
          </button>
        </div>
        <h3 className="font-sora font-bold text-[#1C1C2E] text-lg mb-2">{title}</h3>
        <p className="text-sm text-[#4A4A5A] leading-relaxed mb-5">{body}</p>
        <div className="flex justify-between gap-2">
          <button
            onClick={onBack}
            disabled={stepIdx === 0}
            className="text-xs font-semibold text-[#4A4A5A] px-3 py-2 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-30 transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={onNext}
            className="bg-[#1A3A6B] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#142d55] transition-colors"
          >
            {isLast ? 'Finalizar 🎉' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  )
}
