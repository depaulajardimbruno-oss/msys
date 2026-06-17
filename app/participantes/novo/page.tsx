'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ClienteOpcao {
  id: string
  nome: string
  alias: string | null
}

interface ResultadoCriacao {
  email: string
  senha: string
  cliente_nome: string
}

export default function NovoParticipantePage() {
  return (
    <Suspense fallback={null}>
      <NovoParticipanteForm />
    </Suspense>
  )
}

function NovoParticipanteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clientes, setClientes] = useState<ClienteOpcao[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<ResultadoCriacao | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    async function carregarClientes() {
      const { data } = await (supabase as any)
        .from('clientes')
        .select('id, nome, alias')
        .order('nome')
      setClientes(data ?? [])

      const clientePreSelecionado = searchParams.get('cliente')
      if (clientePreSelecionado) setClienteId(clientePreSelecionado)
    }
    carregarClientes()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const resp = await fetch('/api/participantes/novo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, cliente_id: clienteId }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      setError(data.error || 'Erro ao criar participante.')
      setLoading(false)
      return
    }

    setResultado(data)
    setLoading(false)
  }

  function copiarCredenciais() {
    if (!resultado) return
    navigator.clipboard.writeText(
      `E-mail: ${resultado.email}\nSenha: ${resultado.senha}`
    )
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function novoCadastro() {
    setResultado(null)
    setNome('')
    setEmail('')
    setClienteId('')
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
  const labelCls = "block text-xs text-gray-500 mb-1.5 font-medium"

  if (resultado) {
    return (
      <div className="p-6 max-w-lg">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Participante criado!</h1>
          <p className="text-sm text-gray-500">Envie as credenciais abaixo para o participante.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="p-3 rounded-lg text-sm" style={{ background: '#EBF5EE', color: '#2D6E3E' }}>
            Vinculado à empresa <strong>{resultado.cliente_nome}</strong>.
          </div>

          <div>
            <label className={labelCls}>E-mail de acesso</label>
            <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-800">
              {resultado.email}
            </div>
          </div>

          <div>
            <label className={labelCls}>Senha provisória</label>
            <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono font-semibold tracking-wide text-gray-800">
              {resultado.senha}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Por segurança, esta senha não fica salva em nenhum lugar — copie e envie agora.
            O participante pode trocá-la depois de logar.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={novoCadastro}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              Cadastrar outro
            </button>
            <button type="button" onClick={copiarCredenciais}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                    style={{ background: copiado ? '#2D6E3E' : '#3A8C4E' }}>
              {copiado ? '✓ Copiado' : 'Copiar credenciais'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Novo participante</h1>
        <p className="text-sm text-gray-500">Cadastre um participante já vinculado a uma empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: '#FCEBEB', color: '#A32D2D' }}>{error}</div>
        )}

        <div>
          <label className={labelCls}>Nome completo *</label>
          <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
                 placeholder="Nome do participante" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>E-mail *</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                 placeholder="participante@empresa.com.br" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Empresa *</label>
          <select required value={clienteId} onChange={e => setClienteId(e.target.value)} className={inputCls}>
            <option value="" disabled>Selecione a empresa</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}{c.alias ? ` (${c.alias})` : ''}
              </option>
            ))}
          </select>
          {!clientes.length && (
            <p className="text-xs text-gray-400 mt-1.5">
              Nenhuma empresa cadastrada ainda. Cadastre uma empresa primeiro.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading || !clientes.length}
                  className="px-4 py-2 text-sm rounded-lg text-white font-medium"
                  style={{ background: (loading || !clientes.length) ? '#7AB889' : '#3A8C4E' }}>
            {loading ? 'Criando...' : 'Criar participante'}
          </button>
        </div>
      </form>
    </div>
  )
}
