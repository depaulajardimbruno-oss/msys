'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PERGUNTAS = {
  expectativa: {
    label: 'O conteúdo atendeu às suas expectativas?',
    opcoes: ['Sim, totalmente', 'Parcialmente', 'Não atendeu'],
  },
  didatica: {
    label: 'Como foi a didática do instrutor?',
    opcoes: ['Excelente', 'Boa', 'Regular', 'Ruim'],
  },
  duvidas_restantes: {
    label: 'Ficou com dúvidas após o treinamento?',
    opcoes: ['Nenhuma dúvida', 'Poucas dúvidas', 'Muitas dúvidas'],
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export default function AvaliacaoPage() {
  return (
    <Suspense fallback={null}>
      <AvaliacaoForm />
    </Suspense>
  )
}

function AvaliacaoForm() {
  const router  = useRouter()
  const searchParams = useSearchParams()
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [respostas, setRespostas] = useState<Record<string,string>>({})
  const [comentario, setComentario] = useState('')
  const [treinamentoId, setTreinamentoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [jaAvaliou, setJaAvaliou] = useState(false)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const tId = searchParams.get('treinamento_id')
      if (!tId) { setNaoEncontrado(true); return }

      // Confirma que esse treinamento pertence ao mesmo cliente do participante
      // (a RLS do banco já bloqueia o insert indevido, isso é só para a UI)
      const { data: profile } = await db
        .from('profiles')
        .select('cliente_id')
        .eq('id', user.id)
        .single()

      const { data: treinamento } = await db
        .from('treinamentos')
        .select('id, cliente_id')
        .eq('id', tId)
        .single()

      if (!treinamento || treinamento.cliente_id !== profile?.cliente_id) {
        setNaoEncontrado(true)
        return
      }

      setTreinamentoId(tId)

      // Verifica se já avaliou
      const { data: av } = await db
        .from('avaliacoes')
        .select('id')
        .eq('treinamento_id', tId)
        .eq('participante_id', user.id)
        .single()

      if (av) setJaAvaliou(true)
    }
    load()
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nota) { alert('Por favor, dê uma nota de 1 a 5 estrelas.'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !treinamentoId) return

    await db.from('avaliacoes').insert({
      treinamento_id:    treinamentoId,
      participante_id:   user.id,
      nota,
      expectativa:       respostas.expectativa || '',
      didatica:          respostas.didatica || '',
      duvidas_restantes: respostas.duvidas_restantes || '',
      comentario:        comentario || null,
    })

    setEnviado(true)
    setLoading(false)
  }

  if (naoEncontrado) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Treinamento não encontrado</h1>
        <p className="text-sm text-gray-500 max-w-xs">Acesse a avaliação a partir do botão na página do seu treinamento.</p>
        <button onClick={() => router.push('/portal')}
                className="mt-6 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#3A8C4E' }}>
          Voltar ao portal
        </button>
      </div>
    )
  }

  if (jaAvaliou || enviado) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Obrigado pela avaliação!</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          Seu feedback é muito importante para a MSys continuar melhorando os treinamentos.
        </p>
        <button onClick={() => router.push('/portal')}
                className="mt-6 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#3A8C4E' }}>
          Voltar ao treinamento
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Avaliação do treinamento</h1>
        <p className="text-sm text-gray-500">Sua opinião nos ajuda a melhorar continuamente</p>
      </div>

      <form onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">

        {/* Estrelas */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Nota geral do treinamento
          </p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="text-3xl transition-transform hover:scale-110"
                style={{ color: n <= (hover || nota) ? '#E0A020' : '#e5e7eb' }}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              >★</button>
            ))}
          </div>
          {nota > 0 && (
            <p className="text-xs text-gray-400 mt-1">{nota} de 5 estrelas</p>
          )}
        </div>

        {/* Perguntas de múltipla escolha */}
        {Object.entries(PERGUNTAS).map(([key, q]) => (
          <div key={key}>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{q.label}</p>
            <div className="flex flex-wrap gap-2">
              {q.opcoes.map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setRespostas(r => ({ ...r, [key]: op }))}
                  className="px-3 py-1.5 text-xs rounded-full border transition-colors"
                  style={{
                    background: respostas[key] === op ? '#EBF5EE' : '#fff',
                    borderColor: respostas[key] === op ? '#3A8C4E' : '#e5e7eb',
                    color: respostas[key] === op ? '#2D6E3E' : '#6b7280',
                    fontWeight: respostas[key] === op ? 500 : 400,
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Comentário livre */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Comentários e sugestões (opcional)
          </p>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            rows={3}
            placeholder="Conte como foi sua experiência, o que pode melhorar ou o que mais gostou..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 resize-none bg-white"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading || !nota}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: (!nota || loading) ? '#7AB889' : '#3A8C4E' }}>
            {loading ? 'Enviando...' : '✓ Enviar avaliação'}
          </button>
        </div>
      </form>
    </div>
  )
}
