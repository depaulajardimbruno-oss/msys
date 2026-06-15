import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function CalendarioPage() {
  const supabase = createSupabaseServer()
  const hoje = new Date()

  // Busca treinamentos do mês atual
  const { data: treinamentos } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome)')
    .gte('data_inicio', startOfMonth(hoje).toISOString())
    .lte('data_inicio', endOfMonth(hoje).toISOString())
    .order('data_inicio')

  // Próximos 3 meses
  const { data: proximos } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome)')
    .gte('data_inicio', hoje.toISOString())
    .order('data_inicio')
    .limit(10)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Calendário</h1>
          <p className="text-sm text-gray-500">
            {format(hoje, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link href="/treinamentos/novo"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#3A8C4E' }}>
          + Agendar treinamento
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Mês atual */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">
              Sessões em {format(hoje, "MMMM", { locale: ptBR })}
            </h2>
          </div>
          {!treinamentos?.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Nenhum treinamento agendado este mês.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {treinamentos.map((t: any) => (
                <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-shrink-0 text-center w-10">
                    <div className="text-lg font-semibold text-gray-900 leading-none">
                      {format(new Date(t.data_inicio), 'dd')}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">
                      {format(new Date(t.data_inicio), 'MMM', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="w-0.5 h-8 rounded-full flex-shrink-0"
                       style={{ background: t.tipo === 'revalidacao' ? '#E07A2F' : '#3A8C4E' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.modulo}</p>
                    <p className="text-xs text-gray-500">{t.cliente?.nome} · {t.carga_horaria}h</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    t.tipo === 'revalidacao' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {t.tipo === 'revalidacao' ? 'Revalidação' : 'Novo cliente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Próximos treinamentos</h2>
          </div>
          {!proximos?.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Nenhum treinamento agendado.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {proximos.map((t: any) => (
                <Link key={t.id} href={`/treinamentos/${t.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 text-center w-10">
                    <div className="text-lg font-semibold text-gray-900 leading-none">
                      {format(new Date(t.data_inicio), 'dd')}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">
                      {format(new Date(t.data_inicio), 'MMM', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.modulo}</p>
                    <p className="text-xs text-gray-500">{t.cliente?.nome} · {t.instrutor}</p>
                  </div>
                  <span className="text-xs text-gray-400">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
