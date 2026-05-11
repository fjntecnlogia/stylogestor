import { auth, currentUser } from '@clerk/nextjs/server'

export const metadata = { title: 'Afiliados — STYLOGESTOR' }

export default async function AfiliadosPage() {
  const user = await currentUser()
  const userId = user?.id || ''

  // Código de afiliado baseado no userId (últimos 8 chars)
  const codigoAfiliado = `STYLO-${userId.slice(-8).toUpperCase()}`
  const linkAfiliado = `https://stylogestor.com.br/cadastro?ref=${codigoAfiliado}`

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-sora font-bold text-2xl text-[#111827]">💸 Programa de Afiliados</h1>
        <p className="text-[#6B7280] text-sm mt-1">Indique o STYLOGESTOR e ganhe comissão em cada assinatura.</p>
      </div>

      {/* Como funciona */}
      <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white">
        <h2 className="font-sora font-bold text-lg mb-4">Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', icon: '🔗', title: 'Compartilhe seu link', desc: 'Envie para outras barbearias e salões' },
            { step: '2', icon: '✅', title: 'Eles assinam', desc: 'Ganham 14 dias extras grátis com seu código' },
            { step: '3', icon: '💰', title: 'Você recebe', desc: '20% da primeira mensalidade por indicado' },
          ].map((s) => (
            <div key={s.step} className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl mb-2">{s.icon}</p>
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-white/60 text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seu link */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4">
        <h2 className="font-sora font-bold text-[#111827]">Seu link de indicação</h2>

        <div>
          <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1.5">Código</label>
          <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
            <span className="font-sora font-bold text-[#1A3A6B] text-lg flex-1">{codigoAfiliado}</span>
            <span className="text-xs text-[#6B7280] bg-[#D1FAE5] text-[#065F46] px-2 py-1 rounded-full font-bold">+14 dias grátis</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1.5">Link completo</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={linkAfiliado}
              className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#374151] font-medium"
            />
            <button
              onClick={() => {}}
              className="bg-[#1A3A6B] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#142d55] transition-colors whitespace-nowrap"
              id="copy-btn"
            >
              📋 Copiar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=Olha%20esse%20sistema%20incrível%20para%20barbearias!%20${encodeURIComponent(linkAfiliado)}`}
            target="_blank"
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            💬 Compartilhar no WhatsApp
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            className="flex items-center gap-2 bg-gradient-to-r from-[#833AB4] to-[#E1306C] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            📸 Instagram
          </a>
        </div>
      </div>

      {/* Minhas indicações */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <p className="font-sora font-bold text-[#111827]">Minhas indicações</p>
        </div>
        <div className="p-8 text-center text-[#6B7280]">
          <p className="text-4xl mb-2">🎯</p>
          <p className="font-semibold text-sm">Nenhuma indicação ainda</p>
          <p className="text-xs mt-1">Comece compartilhando seu link!</p>
        </div>
      </div>

      {/* Regras */}
      <div className="bg-[#F0F4FF] border border-[#BFDBFE] rounded-2xl p-5">
        <h3 className="font-semibold text-[#1E40AF] mb-2">Regras do programa</h3>
        <ul className="text-sm text-[#374151] space-y-1">
          <li>✓ Comissão de 20% sobre a primeira mensalidade de cada indicado</li>
          <li>✓ O indicado ganha 14 dias extras de trial (total: 28 dias grátis)</li>
          <li>✓ Comissão paga via PIX em até 30 dias após a assinatura do indicado</li>
          <li>✓ Sem limite de indicações — quanto mais indicar, mais ganha</li>
          <li>✓ O indicado precisa manter a assinatura ativa por 30 dias</li>
        </ul>
      </div>
    </div>
  )
}
