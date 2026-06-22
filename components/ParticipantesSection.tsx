'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ProfileBasico {
  id: string
  nome: string
  email: string
}

interface ParticipantesSectionProps {
  treinamentoId: string
  inscritos: ProfileBasico[]
  disponiveis: ProfileBasico[]
}

const db = supabase as any

export default function ParticipantesSection({ treinamentoId, inscritos, disponiveis }: ParticipantesSectionProps) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const idsInscritos = new Set(inscritos.map(p => p.id))
  const candidatos = disponiveis.filter(p => !idsInscritos.has(p.id))

  async function adicionar() {
    if (!selecionado) return
    setLoading(true)
    setError('')

    const { error: err } = await db.from('participantes').insert({
      treinamento_id: treinamentoId,
      profile_id: selecionado,
    })

    setLoading(false)
    if (err) {
      setError('Erro ao adicionar: ' + err.message)
      return
    }
    setSelecionado('')
    router.refresh()
  }

  async function remover(profileId: string) {
    setLoading(true)
    setError('')

    const { error: err } = await db
      .from('participantes')
      .delete()
      .eq('treinamento_id', treinamentoId)
      .eq('profile_id', profileId)

    setLoading(false)
    if (err) {
      setError('Erro ao remover: ' + err.message)
      return
    }
    router.refresh()
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-700">
          Participantes ({inscritos.length})
        </h2>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
          {error}
        </div>
      )}

      {!inscritos.length ? (
        <p className="px-4 py-6 text-center text-xs text-gray-400">Nenhum participante inscrito.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {inscritos.map((p) => (
            <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-gray-600">
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{p.nome}</div>
                <div className="text-gray-400 truncate">{p.email}</div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => remover(p.id)}
                className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 disabled:opacity-50"
                title="Remover deste treinamento"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-3 border-t border-gray-100">
        {!candidatos.length ? (
          <p className="text-xs text-gray-400">
            {disponiveis.length
              ? 'Todos os participantes desta empresa já estão inscritos.'
              : 'Nenhum participante cadastrado para esta empresa ainda.'}
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              value={selecionado}
              onChange={e => setSelecionado(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-green-600"
            >
              <option value="">Adicionar participante…</option>
              {candidatos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selecionado || loading}
              onClick={adicionar}
              className="px-3 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-50"
              style={{ background: '#3A8C4E' }}
            >
              + Adicionar
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
