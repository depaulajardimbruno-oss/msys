import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function PortalPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Busca o profile do participante para saber a qual cliente ele pertence
  const { data: profile } = await supabase
    .from('profiles')
    .select('cliente_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.cliente_id) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Nenhum treinamento encontrado</h1>
        <p className="text-sm text-gray-500">Você ainda não foi vinculado a nenhuma empresa.<br/>Entre em contato com a equipe MSys.</p>
      </div>
    )
  }

  // Busca todos os treinamentos do cliente do participante
  const { data: treinamentos } = await supabase
    .from('treinamentos')
    .select('*, cliente:clientes(nome)')
    .eq('cliente_id', profile.cliente_id)
    .order('data_inicio', { ascending: false })

  if (!treinamentos?.length) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Nenhum treinamento encontrado</h1>
        <p className="text-sm text-gray-500">Você ainda não foi vinculado a nenhum treinamento.<br/>Entre em contato com a equipe MSys.</p>
      </div>
    )
  }

  // Avaliações já feitas por este participante (para saber quais já foram avaliados)
  const { data: avaliacoesFeitas } = await supabase
    .from('avaliacoes')
    .select('treinamento_id')
    .eq('participante_id', session.user.id)

  const idsAvaliados = new Set((avaliacoesFeitas ?? []).map((a: any) => a.treinamento_id))

  // Sessões e materiais de todos os treinamentos do cliente, de uma vez
  const treinamentoIds = treinamentos.map((t: any) => t.id)

  const { data: todasSessoes } = await supabase
    .from('sessoes')
    .select('*')
    .in('treinamento_id', treinamentoIds)
    .order('inicio')

  const { data: todosMateriais } = await supabase
    .from('materiais')
    .select('*')
    .in('treinamento_id', treinamentoIds)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {treinamentos.map((t: any) => {
        const sessoes = (todasSessoes ?? []).filter((s: any) => s.treinamento_id === t.id)
        const materiais = (todosMateriais ?? []).filter((m: any) => m.treinamento_id === t.id)
        const jaAvaliou = idsAvaliados.has(t.id)

        return (
          <div key={t.id}>
            {/* Header verde */}
            <div className="rounded-xl overflow-hidden mb-5" style={{ background: '#3A8C4E' }}>
              <div className="p-5 text-white">
                <div className="text-xs font-medium opacity-75 mb-1 uppercase tracking-wide">
                  {t.tipo === 'revalidacao' ? '🔄 Revalidação' : '🚀 Novo cliente'}
                </div>
                <h1 className="text-xl font-semibold mb-2">{t.modulo}</h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm opacity-90">
                  <span>🏢 {t.cliente?.nome}</span>
                  <span>⏱ {t.carga_horaria}h de treinamento</span>
                  {t.data_inicio && (
                    <span>📅 {format(new Date(t.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Botão Teams em destaque */}
            {t.link_teams && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Sessão via Microsoft Teams</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{t.link_teams}</p>
                </div>
                <a href={t.link_teams} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white flex-shrink-0"
                   style={{ background: '#5059C9' }}>
                  📹 Entrar agora
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              {/* Cronograma */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-700">Cronograma</h2>
                </div>
                {!sessoes.length ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Cronograma não disponível.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {sessoes.map((s: any) => (
                      <div key={s.id} className="px-4 py-2.5 flex gap-3">
                        <span className="text-xs text-gray-400 font-mono min-w-[90px] pt-0.5">{s.inicio}–{s.fim}</span>
                        <span className="text-xs text-gray-700">{s.descricao}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-700">O que foi abordado</h2>
                </div>
                {!t.conteudo?.length ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Conteúdo ainda não registrado.</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {t.conteudo.map((item: string, i: number) => (
                      <li key={i} className="px-4 py-2.5 flex items-start gap-2 text-xs text-gray-700">
                        <span style={{ color: '#3A8C4E' }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Materiais */}
            {materiais.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mt-5">
                <h2 className="text-sm font-medium text-gray-700 mb-3">Materiais de apoio</h2>
                <div className="flex flex-wrap gap-2">
                  {materiais.map((m: any) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                      {m.tipo === 'manual' ? '📄' : m.tipo === 'slides' ? '📊' : m.tipo === 'gravacao' ? '▶️' : '📎'}
                      {m.nome}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Avaliação */}
            {!jaAvaliou && t.status === 'concluido' && (
              <div className="mt-5 rounded-xl p-4 flex items-center justify-between"
                   style={{ background: '#EBF5EE', border: '1px solid #C2E0CB' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2D6E3E' }}>Treinamento concluído!</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3A8C4E' }}>Avalie sua experiência e nos ajude a melhorar.</p>
                </div>
                <a href={`/avaliacao?treinamento_id=${t.id}`}
                   className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                   style={{ background: '#3A8C4E' }}>
                  Avaliar agora ★
                </a>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
