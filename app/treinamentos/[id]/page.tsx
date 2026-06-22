import { createSupabaseServer } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ParticipantesSection from '@/components/ParticipantesSection'

export default async function TreinamentoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()

  const { data: t } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(*)')
    .eq('id', params.id)
    .single()

  if (!t) notFound()

  const { data: sessoes } = await supabase
    .from('sessoes')
    .select('*')
    .eq('treinamento_id', t.id)
    .order('inicio')

  // Participantes inscritos especificamente neste treinamento
  const { data: inscricoes } = await supabase
    .from('participantes')
    .select('profile:profiles(id, nome, email)')
    .eq('treinamento_id', t.id)

  const inscritos = (inscricoes ?? [])
    .map((i: any) => i.profile)
    .filter(Boolean)

  // Todos os participantes da empresa, para oferecer como opção de inscrição
  const { data: disponiveis } = await supabase
    .from('profiles')
    .select('id, nome, email')
    .eq('cliente_id', t.cliente_id)
    .eq('role', 'participante')

  const { data: materiais } = await supabase
    .from('materiais')
    .select('*')
    .eq('treinamento_id', t.id)

  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('treinamento_id', t.id)

  const npsMedia = avaliacoes?.length
    ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.tipo === 'revalidacao' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}>
                {t.tipo === 'revalidacao' ? 'Revalidação' : 'Novo cliente'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.status === 'concluido' ? 'bg-gray-100 text-gray-600' :
                t.status === 'em_andamento' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {t.status === 'concluido' ? 'Concluído' : t.status === 'em_andamento' ? 'Em andamento' : 'Agendado'}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{t.modulo}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{(t.cliente as any)?.nome} · {t.carga_horaria}h · Instrutor: {t.instrutor}</p>
          </div>
          {t.link_teams && (
            <a href={t.link_teams} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
               style={{ background: '#5059C9' }}>
              📹 Entrar no Teams
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-5">

          {/* Sessões / Cronograma */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">Cronograma da sessão</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.data_inicio ? format(new Date(t.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'}
              </p>
            </div>
            {!sessoes?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma sessão cadastrada.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessoes.map((s: any) => (
                  <div key={s.id} className="px-5 py-3 flex gap-4">
                    <span className="text-xs text-gray-400 min-w-[100px] font-mono pt-0.5">
                      {s.inicio} – {s.fim}
                    </span>
                    <span className="text-sm text-gray-700">{s.descricao}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Conteúdo abordado */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">O que foi abordado</h2>
            </div>
            {!t.conteudo?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum conteúdo registrado.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {t.conteudo.map((item: string, i: number) => (
                  <li key={i} className="px-5 py-2.5 flex items-start gap-3 text-sm text-gray-700">
                    <span style={{ color: '#3A8C4E' }} className="mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Materiais */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">Materiais de apoio</h2>
            </div>
            {!materiais?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum material adicionado.</p>
            ) : (
              <div className="p-4 flex flex-wrap gap-2">
                {materiais.map((m: any) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                    {m.tipo === 'manual' ? '📄' : m.tipo === 'slides' ? '📊' : m.tipo === 'gravacao' ? '▶️' : '📎'}
                    {m.nome}
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">

          {/* Participantes */}
          <ParticipantesSection
            treinamentoId={t.id}
            inscritos={inscritos}
            disponiveis={disponiveis ?? []}
          />

          {/* Avaliações */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-700">Avaliações</h2>
            </div>
            {!avaliacoes?.length ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">Nenhuma avaliação ainda.</p>
            ) : (
              <div className="p-4">
                <div className="text-3xl font-semibold text-center mb-1" style={{ color: '#3A8C4E' }}>
                  {npsMedia}
                </div>
                <div className="text-xs text-center text-gray-400 mb-3">
                  média de {avaliacoes.length} avaliação{avaliacoes.length > 1 ? 'ões' : ''}
                </div>
                <div className="space-y-2">
                  {avaliacoes.map((a: any) => (
                    <div key={a.id} className="text-xs text-gray-600 border border-gray-100 rounded-lg p-2">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{'★'.repeat(a.nota)}{'☆'.repeat(5 - a.nota)}</span>
                      </div>
                      {a.comentario && <p className="text-gray-500 text-xs">{a.comentario}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Chamados (revalidação) */}
          {t.tipo === 'revalidacao' && (
            <div className="rounded-xl p-4 text-xs" style={{ background: '#FEF3E2' }}>
              <p className="font-medium mb-1" style={{ color: '#A0601A' }}>⚠ Revalidação acionada</p>
              <p style={{ color: '#A0601A' }}>{t.chamados_count} chamados registrados no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
