'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function gerarAlias(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const parte1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const parte2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${parte1}-${parte2}`
}

export default function NovoClientePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '', tipo: 'Factoring', contato_nome: '', contato_email: '', alias: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setForm(f => ({ ...f, alias: gerarAlias() }))
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function regenerarAlias() {
    setForm(f => ({ ...f, alias: gerarAlias() }))
    setCopiado(false)
  }

  function copiarAlias() {
    navigator.clipboard.writeText(form.alias)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error: err } = await (supabase as any).from('clientes').insert(form)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/clientes')
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
  const labelCls = "block text-xs text-gray-500 mb-1.5 font-medium"

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Novo cliente</h1>
        <p className="text-sm text-gray-500">Cadastre uma nova empresa na plataforma</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: '#FCEBEB', color: '#A32D2D' }}>{error}</div>
        )}

        <div>
          <label className={labelCls}>Nome da empresa *</label>
          <input required type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
                 placeholder="Ex: Factoring Sul Ltda" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Tipo *</label>
          <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
            {['Factoring','FIDC','ESC','Securitizadora','Outro'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome do contato</label>
            <input type="text" value={form.contato_nome} onChange={e => set('contato_nome', e.target.value)}
                   placeholder="Nome" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-mail do contato</label>
            <input type="email" value={form.contato_email} onChange={e => set('contato_email', e.target.value)}
                   placeholder="email@empresa.com" className={inputCls} />
          </div>
        </div>

        {/* Alias */}
        <div>
          <label className={labelCls}>Código de acesso (alias)</label>
          <div className="flex gap-2 items-center">
            <div className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono tracking-widest font-semibold text-gray-800">
              {form.alias}
            </div>
            <button type="button" onClick={copiarAlias}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: copiado ? '#3A8C4E' : '#6b7280' }}>
              {copiado ? '✓ Copiado' : 'Copiar'}
            </button>
            <button type="button" onClick={regenerarAlias}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
              ↻ Novo
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Compartilhe este código com os participantes da empresa para que possam se cadastrar.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ background: loading ? '#7AB889' : '#3A8C4E' }}>
            {loading ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
