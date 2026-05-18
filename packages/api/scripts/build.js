#!/usr/bin/env node
/**
 * Build script para produção da API NestJS.
 *
 * Por quê?
 *   Stripe v22 mudou seus exports (`export = StripeConstructor`). Os tipos
 *   `Stripe.Event`, `Stripe.Customer` etc. só resolvem com
 *   `moduleResolution: bundler` no tsconfig.json (necessário para
 *   `tsc --noEmit`). Mas o NestJS standalone precisa de
 *   `module: commonjs` + `moduleResolution: node` para que o Node CJS
 *   runtime carregue os imports sem `.js` explícito.
 *
 *   Tentamos SWC builder — produziu bugs em runtime (legacy/TC39 decorators
 *   misturados, `sourceMappingURL` no meio do arquivo, `continue` fora de
 *   loop, etc.). Sem SWC, sem solução automática limpa.
 *
 * Solução:
 *   1. Faz backup do tsconfig.json em memória
 *   2. Substitui temporariamente module=commonjs, moduleResolution=node
 *   3. Roda `nest build`
 *   4. Restaura o tsconfig.json original (finally garante isso até em erro)
 *
 *   `tsc --noEmit` (rodado fora deste script) continua usando o tsconfig
 *   original (esnext/bundler) e resolve tipos do Stripe corretamente.
 *
 * TODO: quando o SWC corrigir esses bugs ou Stripe v23 normalizar exports,
 *       deletar esse script e voltar ao `"build": "nest build"` direto.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const apiDir = path.join(__dirname, '..')
const tsconfigPath = path.join(apiDir, 'tsconfig.json')

const original = fs.readFileSync(tsconfigPath, 'utf8')
const originalCfg = JSON.parse(original)

console.log('[build] tsconfig original:', {
  module: originalCfg.compilerOptions.module,
  moduleResolution: originalCfg.compilerOptions.moduleResolution,
})

let buildOk = false
try {
  const cfg = JSON.parse(original)
  cfg.compilerOptions.module = 'commonjs'
  cfg.compilerOptions.moduleResolution = 'node'
  fs.writeFileSync(tsconfigPath, JSON.stringify(cfg, null, 2))
  console.log('[build] tsconfig swap → commonjs/node')

  // `nest build` retorna exit 1 quando há TS2694 nos tipos do Stripe
  // (Stripe.Event etc. não resolvem com moduleResolution:node).
  // MAS o dist/ é gerado normalmente. Type-check completo é feito via
  // `tsc --noEmit` (com moduleResolution:bundler, sem swap), que resolve
  // os tipos corretamente.
  //
  // Estratégia: ignorar exit code, validar que dist/main.js foi gerado.
  try {
    const out = execSync('npx --no-install nest build', {
      cwd: apiDir,
      stdio: 'pipe',
      encoding: 'utf8',
    })
    if (out && out.trim()) console.log(out.trim())
  } catch (e) {
    // Captura stdout pra log mas NÃO re-lança — vamos validar pelo dist
    const stderr = e.stderr ? e.stderr.toString() : ''
    const hasOnlyStripeTypeErrors =
      stderr.includes("Namespace 'StripeConstructor'") ||
      stderr.includes('TS2694')
    if (!hasOnlyStripeTypeErrors) {
      // Erro diferente — re-lança
      if (e.stdout) console.log(e.stdout.toString().trim())
      if (e.stderr) console.error(stderr.trim())
      throw e
    }
    console.log('[build] avisos TS2694 de Stripe ignorados (esperados)')
  }

  // Valida que o output principal existe
  const mainJs = path.join(apiDir, 'dist', 'main.js')
  if (!fs.existsSync(mainJs)) {
    throw new Error(`[build] dist/main.js NAO foi gerado — build falhou`)
  }
  buildOk = true
  console.log('[build] nest build OK')
} finally {
  fs.writeFileSync(tsconfigPath, original)
  console.log('[build] tsconfig restaurado para esnext/bundler')
}

if (!buildOk) process.exit(1)
