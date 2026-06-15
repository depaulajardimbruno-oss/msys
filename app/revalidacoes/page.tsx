import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function RevalidacoesPage() {
  const supabase = createSupabaseServer()

  const { data: revalidacoes } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome, tipo)')
    .eq('tipo', 'revalidacao')
    .neq('status', 'concluido')
    .order('chamados_count', { ascending: false })

  const total = revalidacoes?.length ?? 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Revalidações</h1>
        <p className="text-sm text-gray-500">Acionadas por alto volume de chamados ou dúvidas recorrentes</p>
      </div>

      {/* Alerta explicativo */}
      <div className="flex items-start gap-3 p-4 rounded-xl mb-6 text-sm"
           style={{ background: '#FEF3E2', color: '#A0601A' }}>
        <span className="text-base mt-0.5">⚠</span>
        <div>
          <strong>Como funciona:</strong> Quando um cliente abre muitos chamados ou apresenta dúvidas recorrentes
          sobre o mesmo tema, a equipe MSys aciona uma revalidação do treinamento para reforçar o conteúdo necessário.
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Revalidações abertas', value: total, warn: total > 0 },
          { label: 'Em andamento', value: revalidacoes?.filter(r => r.status === 'em_andamento').length ?? 0 },
          { label: 'Agendadas', value: revalidacoes?.filter(r => r.status === 'agendado').length ?? 0 },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4"
               style={{ borderTop: '3px solid #3A8C4E' }}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-semibold ${m.warn && m.value > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Clientes em revalidação</h2>
        </div>
        {!revalidacoes?.length ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">Nenhuma revalidação aberta. ✓</p>
            <p className="text-xs text-gray-400 mt-1">Todos os clientes estão operando bem!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {revalidacoes.map((r: any) => (
              <div key={r.id}
                   className="px-5 py-4 flex items-center gap-4"
                   style={{ borderLeft: r.chamados_count >= 10 ? '3px solid #E07A2F' : '3px solid transparent' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-gray-900 truncate">{r.modulo}</span>
                    {r.chamados_count >= 10 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                        Urgente
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.cliente?.nome} · {r.cliente?.tipo}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#A0601A' }}>
                    📞 {r.chamados_count} chamados registrados
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === 'em_andamento' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {r.status === 'em_andamento' ? 'Em andamento' : 'Agendada'}
                  </span>
                  <div className="mt-2">
                    <Link href={`/treinamentos/${r.id}`}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#3A8C4E' }}>
                      Ver detalhes →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
