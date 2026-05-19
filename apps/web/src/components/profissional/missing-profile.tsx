/**
 * Estado renderizado quando o barbeiro logado não tem profissional
 * correspondente no storage do tenant. Acontece em 2 cenários:
 *   1. SSR/prerender — localStorage ainda não disponível
 *   2. Gestor convidou o barbeiro mas ainda não criou o registro
 *      em /profissionais (ou apagou)
 */
export function MissingProfile({ titulo }: { titulo: string }) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#1C1C2E]">{titulo}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
        <p className="text-5xl mb-3">🪪</p>
        <p className="font-sora font-bold text-[#111827]">Seu perfil ainda não foi configurado</p>
        <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
          Peça pro gestor te cadastrar em <span className="font-semibold text-[#1A3A6B]">Profissionais</span> no painel
          dele. Assim que ele criar seu registro, essa tela vai funcionar.
        </p>
      </div>
    </div>
  )
}
