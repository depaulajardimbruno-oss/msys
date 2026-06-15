import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLOR: Record<string, string> = {
  agendado:     'bg-blue-50 text-blue-700',
  em_andamento: 'bg-green-50 text-green-700',
  concluido:    'bg-gray-100 text-gray-600',
  cancelado:    'bg-red-50 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado'
}

export default async function TreinamentosPage() {
  const supabase = createSupabaseServer()

  const { data: treinamentos } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome)')
    .order('data_inicio', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Treinamentos</h1>
          <p className="text-sm text-gray-500">Gerencie todos os módulos de capacitação</p>
        </div>
        <Link
          href="/treinamentos/novo"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#3A8C4E' }}
        >
          + Novo treinamento
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!treinamentos?.length ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Nenhum treinamento cadastrado.{' '}
            <Link href="/treinamentos/novo" style={{ color: '#3A8C4E' }}>Criar agora</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['Módulo','Cliente','Tipo','Data início','Carga','Instrutor','Status',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treinamentos.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{t.modulo}</td>
                  <td className="px-5 py-3 text-gray-600">{t.cliente?.nome}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.tipo === 'revalidacao' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {t.tipo === 'revalidacao' ? 'Revalidação' : 'Novo cliente'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {format(new Date(t.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{t.carga_horaria}h</td>
                  <td className="px-5 py-3 text-gray-600">{t.instrutor}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/treinamentos/${t.id}`}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#3A8C4E' }}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
