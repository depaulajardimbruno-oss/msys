import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ClientesPage() {
  const supabase = createSupabaseServer()
  const { data: clientes } = await (supabase as any)
    .from('clientes')
    .select('*, treinamentos(count), profiles(count)')
    .order('nome')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Empresas cadastradas na plataforma</p>
        </div>
        <Link href="/clientes/novo"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#3A8C4E' }}>
          + Novo cliente
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!clientes?.length ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Nenhum cliente cadastrado.{' '}
            <Link href="/clientes/novo" style={{ color: '#3A8C4E' }}>Cadastrar agora</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['Empresa','Tipo','Contato','Código (alias)','Participantes','Treinamentos',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{c.nome}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.contato_nome || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {c.alias}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {c.profiles?.[0]?.count ?? 0}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {c.treinamentos?.[0]?.count ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/treinamentos/novo?cliente=${c.id}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: '#3A8C4E' }}>
                        + Treinamento
                      </Link>
                      <Link href={`/participantes/novo?cliente=${c.id}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: '#3A8C4E' }}>
                        + Participante
                      </Link>
                    </div>
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
