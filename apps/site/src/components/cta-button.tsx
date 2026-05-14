'use client'

import Link from 'next/link'
import { trackCTAClick, trackPlanClick } from '@/lib/analytics'

interface CTAButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  location: string
  plan?: string
  price?: number
}

export function CTAButton({ href, children, className, location, plan, price }: CTAButtonProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackCTAClick(location, plan)
        if (plan && price) trackPlanClick(plan, price)
      }}
    >
      {children}
    </Link>
  )
}
