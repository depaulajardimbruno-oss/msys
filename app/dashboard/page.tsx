import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado'
}
const STATUS_COLOR: Record<string, string> = {
  agendado: 'bg-blue-50 text-blue-700',
  em_andamento: 'bg-green-50 text-green-700',
  concluido: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-50 text-red-600',
}
const TIPO_LABEL: Record<string, string> = {
  novo_cliente: 'Novo cliente', revalidacao: 'Revalidação'
}
const TIPO_COLOR: Record<string, string> = {
  novo_cliente: 'bg-green-50 text-green-700',
  revalidacao: 'bg-amber-50 text-amber-700',
}

export default async function DashboardPage() {
  const supabase = createSupabaseServer()

  // Métricas
  const [
    { count: totalClientes },
    { count: emAndamento },
    { count: revalidacoes },
    { count: certificados },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }).eq('tipo', 'revalidacao').neq('status', 'concluido'),
    supabase.from('treinamentos').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
  ])

  // Treinamentos recentes
  const { data: treinamentos } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome, tipo)')
    .order('created_at', { ascending: false })
    .limit(6)

  const metrics = [
    { label: 'Clientes ativos',           value: totalClientes ?? 0, sub: 'cadastrados' },
    { label: 'Treinamentos em andamento', value: emAndamento ?? 0,   sub: 'no momento' },
    { label: 'Revalidações abertas',      value: revalidacoes ?? 0,  sub: 'por alto volume de chamados', warn: true },
    { label: 'Treinamentos concluídos',   value: certificados ?? 0,  sub: 'total' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral da plataforma</p>
        </div>
        <Link
          href="/treinamentos/novo"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#3A8C4E' }}
        >
          + Novo treinamento
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label}
               className="bg-white border border-gray-200 rounded-xl p-4"
               style={{ borderTop: '3px solid #3A8C4E' }}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
            <p className={`text-xs mt-1 ${m.warn ? 'text-amber-600' : 'text-gray-400'}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Treinamentos recentes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Treinamentos recentes</h2>
          <Link href="/treinamentos" className="text-xs font-medium" style={{ color: '#3A8C4E' }}>
            Ver todos →
          </Link>
        </div>

        {!treinamentos?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nenhum treinamento cadastrado ainda.{' '}
            <Link href="/treinamentos/novo" style={{ color: '#3A8C4E' }}>Criar o primeiro</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Módulo</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Cliente</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Tipo</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Data início</th>
                <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {treinamentos.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    <Link href={`/treinamentos/${t.id}`} className="hover:underline" style={{ color: '#2D6E3E' }}>
                      {t.modulo}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{t.cliente?.nome}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[t.tipo]}`}>
                      {TIPO_LABEL[t.tipo]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {format(new Date(t.data_inicio), "dd 'de' MMM yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
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
