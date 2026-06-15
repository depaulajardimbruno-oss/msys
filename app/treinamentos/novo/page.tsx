'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cliente } from '@/types/database'

export default function NovoTreinamentoPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState({
    cliente_id:    '',
    modulo:        '',
    tipo:          'novo_cliente',
    status:        'agendado',
    data_inicio:   '',
    carga_horaria: '8',
    instrutor:     '',
    link_teams:    '',
  })

  useEffect(() => {
    supabase.from('clientes').select('*').order('nome').then(({ data }) => {
      if (data) setClientes(data)
    })
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('treinamentos').insert({
      ...form,
      carga_horaria: parseInt(form.carga_horaria),
      link_teams: form.link_teams || null,
      conteudo: [],
      chamados_count: 0,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/treinamentos')
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
  const labelCls = "block text-xs text-gray-500 mb-1.5 font-medium"

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Novo treinamento</h1>
        <p className="text-sm text-gray-500">Preencha os dados para agendar um novo módulo</p>
      </div>

      <form onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Empresa / cliente *</label>
          <select required value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} className={inputCls}>
            <option value="">Selecione o cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Cliente não cadastrado?{' '}
            <a href="/clientes/novo" style={{ color: '#3A8C4E' }}>Cadastrar agora</a>
          </p>
        </div>

        <div>
          <label className={labelCls}>Módulo *</label>
          <input required type="text" value={form.modulo}
                 onChange={e => set('modulo', e.target.value)}
                 placeholder="Ex: Onboarding SIFAC — Módulo 1"
                 className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Tipo *</label>
          <div className="flex gap-4">
            {[
              { value: 'novo_cliente', label: 'Novo cliente' },
              { value: 'revalidacao', label: 'Revalidação' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                <input type="radio" name="tipo" value={opt.value}
                       checked={form.tipo === opt.value}
                       onChange={e => set('tipo', e.target.value)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data de início *</label>
            <input required type="date" value={form.data_inicio}
                   onChange={e => set('data_inicio', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Carga horária (horas) *</label>
            <input required type="number" min="1" value={form.carga_horaria}
                   onChange={e => set('carga_horaria', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Instrutor responsável *</label>
            <input required type="text" value={form.instrutor}
                   onChange={e => set('instrutor', e.target.value)}
                   placeholder="Nome do instrutor" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Link do Teams</label>
            <input type="text" value={form.link_teams}
                   onChange={e => set('link_teams', e.target.value)}
                   placeholder="https://teams.microsoft.com/..." className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ background: loading ? '#7AB889' : '#3A8C4E' }}>
            {loading ? 'Salvando...' : 'Salvar treinamento'}
          </button>
        </div>
      </form>
    </div>
  )
}
