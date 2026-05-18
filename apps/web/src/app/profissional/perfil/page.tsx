export const metadata = { title: 'Meu Perfil — STYLOGESTOR' }

export default function PerfilProfissionalPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">Meu Perfil</h1>
      <p className="text-sm text-[#6B7280] mt-1">Atualize nome, foto e especialidades</p>

      <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
        <p className="text-5xl mb-3">👤</p>
        <p className="font-sora font-bold text-[#111827]">Em construção</p>
        <p className="text-sm text-[#6B7280] mt-1">Edição de perfil próprio chega em breve.</p>
      </div>
    </div>
  )
}
