// Cliente Supabase pro browser (componentes 'use client').
// Fase 3 — login único: web e mobile no mesmo projeto Supabase.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
