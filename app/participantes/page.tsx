import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ParticipantesPage({ searchParams }: { searchParams: { cliente?: string } }) {
  const supabase = createSupabaseServer()

  let query = (supabase as any)
    .from('profiles')
    .select('id, nome, email, cliente_id, cliente:clientes(id, nome), inscricoes:participantes(count)')
    .eq('role', 'participante')
    .order('nome')

  if (searchParams.cliente) {
    query = query.eq('cliente_id', searchParams.cliente)
  }

  const { data: participantes } = await query

  const { data: clientes } = await (supabase as any)
    .from('clientes')
    .select('id, nome')
    .order('nome')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Participantes</h1>
          <p className="text-sm text-gray-500">Pessoas cadastradas no portal de treinamentos</p>
        </div>
        <Link href="/participantes/novo"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#3A8C4E' }}>
          + Novo participante
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Link href="/participantes"
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${!searchParams.cliente ? 'text-white' : 'text-gray-600 bg-gray-100'}`}
              style={!searchParams.cliente ? { background: '#3A8C4E' } : {}}>
          Todas as empresas
        </Link>
        {(clientes ?? []).map((c: any) => (
          <Link key={c.id} href={`/participantes?cliente=${c.id}`}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${searchParams.cliente === c.id ? 'text-white' : 'text-gray-600 bg-gray-100'}`}
                style={searchParams.cliente === c.id ? { background: '#3A8C4E' } : {}}>
            {c.nome}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!participantes?.length ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Nenhum participante encontrado.{' '}
            <Link href="/participantes/novo" style={{ color: '#3A8C4E' }}>Cadastrar agora</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['Nome', 'E-mail', 'Empresa', 'Treinamentos inscritos', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participantes.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.nome}</td>
                  <td className="px-5 py-3 text-gray-600">{p.email}</td>
                  <td className="px-5 py-3 text-gray-600">{p.cliente?.nome ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{p.inscricoes?.[0]?.count ?? 0}</td>
                  <td className="px-5 py-3">
                    {p.cliente_id && (
                      <Link href={`/clientes`} className="text-xs font-medium hover:underline" style={{ color: '#3A8C4E' }}>
                        Ver empresa
                      </Link>
                    )}
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
