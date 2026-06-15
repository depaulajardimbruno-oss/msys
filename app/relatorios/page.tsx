import { createSupabaseServer } from '@/lib/supabase-server'

export default async function RelatoriosPage() {
  const supabase = createSupabaseServer()

  const [
    { count: totalTreinamentos },
    { count: concluidos },
    { data: avaliacoes },
    { data: treinamentos },
  ] = await Promise.all([
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
    supabase.from('avaliacoes').select('nota'),
    supabase.from('treinamentos').select('modulo, status, carga_horaria').order('modulo'),
  ])

  const taxa = totalTreinamentos ? Math.round(((concluidos ?? 0) / totalTreinamentos) * 100) : 0
  const npsMedia = avaliacoes?.length
    ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
    : '—'

  const totalHoras = treinamentos?.reduce((s, t) => s + (t.carga_horaria || 0), 0) ?? 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Métricas e desempenho da plataforma</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Taxa de conclusão',     value: `${taxa}%`, sub: 'dos treinamentos' },
          { label: 'Horas registradas',     value: `${totalHoras}h`, sub: 'carga total' },
          { label: 'NPS médio',             value: npsMedia, sub: `${avaliacoes?.length ?? 0} avaliações` },
          { label: 'Treinamentos concluídos', value: concluidos ?? 0, sub: 'de ' + (totalTreinamentos ?? 0) },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4"
               style={{ borderTop: '3px solid #3A8C4E' }}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Desempenho por módulo */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Desempenho por módulo</h2>
        </div>
        {!treinamentos?.length ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Nenhum dado disponível.</p>
        ) : (
          <div className="p-5 space-y-4">
            {treinamentos.map((t: any, i: number) => {
              const pct = t.status === 'concluido' ? 100 : t.status === 'em_andamento' ? 50 : 0
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-700">{t.modulo}</span>
                    <span className="font-medium text-gray-900">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${pct}%`, background: '#3A8C4E' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
