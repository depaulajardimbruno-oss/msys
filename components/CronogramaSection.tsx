'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Sessao {
  id: string
  inicio_em: string | null
  fim_em: string | null
  descricao: string
  concluida: boolean
}

interface CronogramaSectionProps {
  treinamentoId: string
  cargaHoraria: number
  sessoes: Sessao[]
}

const db = supabase as any

function duracaoHoras(inicio: string | null, fim: string | null): number {
  if (!inicio || !fim) return 0
  const ms = new Date(fim).getTime() - new Date(inicio).getTime()
  return Math.max(0, ms / 1000 / 60 / 60)
}

export default function CronogramaSection({ treinamentoId, cargaHoraria, sessoes }: CronogramaSectionProps) {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const horasConcluidas = sessoes
    .filter(s => s.concluida)
    .reduce((acc, s) => acc + duracaoHoras(s.inicio_em, s.fim_em), 0)

  const saldoExcedido = horasConcluidas > cargaHoraria

  async function agendar(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !horaInicio || !horaFim || !descricao.trim()) return
    setError('')

    const inicio_em = new Date(`${data}T${horaInicio}`).toISOString()
    const fim_em = new Date(`${data}T${horaFim}`).toISOString()

    if (new Date(fim_em) <= new Date(inicio_em)) {
      setError('O horário de término deve ser depois do início.')
      return
    }

    setLoading(true)
    const { error: err } = await db.from('sessoes').insert({
      treinamento_id: treinamentoId,
      inicio_em,
      fim_em,
      descricao: descricao.trim(),
      concluida: false,
      // mantém os campos antigos preenchidos por compatibilidade com o portal
      inicio: horaInicio,
      fim: horaFim,
    })

    setLoading(false)
    if (err) {
      setError('Erro ao agendar: ' + err.message)
      return
    }

    setData('')
    setHoraInicio('')
    setHoraFim('')
    setDescricao('')
    setMostrarForm(false)
    router.refresh()
  }

  async function alternarConcluida(sessaoId: string, novoValor: boolean) {
    setLoading(true)
    const { error: err } = await db
      .from('sessoes')
      .update({ concluida: novoValor })
      .eq('id', sessaoId)
    setLoading(false)
    if (err) {
      setError('Erro ao atualizar: ' + err.message)
      return
    }
    router.refresh()
  }

  async function remover(sessaoId: string) {
    setLoading(true)
    const { error: err } = await db.from('sessoes').delete().eq('id', sessaoId)
    setLoading(false)
    if (err) {
      setError('Erro ao remover: ' + err.message)
      return
    }
    router.refresh()
  }

  const inputCls = "w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"

  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-700">Cronograma da sessão</h2>
          <p className="text-xs mt-0.5" style={{ color: saldoExcedido ? '#A0601A' : '#9CA3AF' }}>
            Saldo: {horasConcluidas % 1 === 0 ? horasConcluidas : horasConcluidas.toFixed(1)}h de {cargaHoraria}h utilizadas
            {saldoExcedido && ' — carga horária excedida'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarForm(v => !v)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: mostrarForm ? '#F3F4F6' : '#EBF5EE', color: '#2D6E3E' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Agendar sessão'}
        </button>
      </div>

      {error && (
        <div className="px-5 py-2 text-xs" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
          {error}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={agendar} className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" required value={data} onChange={e => setData(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Início</label>
              <input type="time" required value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Término</label>
              <input type="time" required value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição</label>
            <input type="text" required value={descricao} onChange={e => setDescricao(e.target.value)}
                   placeholder="Ex: Módulo 2 — Lançamentos e conciliação" className={inputCls} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading}
                    className="px-4 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-50"
                    style={{ background: '#3A8C4E' }}>
              {loading ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      )}

      {!sessoes.length ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma sessão cadastrada.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {sessoes.map((s) => {
            const horas = duracaoHoras(s.inicio_em, s.fim_em)
            return (
              <div key={s.id} className="px-5 py-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={s.concluida}
                  disabled={loading}
                  onChange={e => alternarConcluida(s.id, e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-green-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${s.concluida ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {s.descricao}
                    </span>
                    {s.concluida && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#EBF5EE', color: '#2D6E3E' }}>
                        Concluída
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {s.inicio_em ? format(new Date(s.inicio_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                    {s.fim_em ? ` – ${format(new Date(s.fim_em), 'HH:mm')}` : ''}
                    {horas > 0 ? ` · ${horas % 1 === 0 ? horas : horas.toFixed(1)}h` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => remover(s.id)}
                  className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
