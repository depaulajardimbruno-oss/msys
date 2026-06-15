'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Modo = 'login' | 'cadastro'

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>('login')
  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [alias, setAlias]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sucesso, setSucesso]   = useState('')

  function trocarModo(m: Modo) {
    setModo(m)
    setError('')
    setSucesso('')
    setNome('')
    setEmail('')
    setPassword('')
    setConfirmar('')
    setAlias('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('E-mail ou senha incorretos.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    await new Promise(resolve => setTimeout(resolve, 500))

    if (profile?.role === 'gestor') {
      window.location.replace('/dashboard')
    } else {
      window.location.replace('/portal')
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmar) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)

    // 1. Valida o alias e busca o cliente
    const aliasUpper = alias.trim().toUpperCase()
    const { data: cliente, error: aliasErr } = await (supabase as any)
      .from('clientes')
      .select('id, nome')
      .eq('alias', aliasUpper)
      .single()

    if (aliasErr || !cliente) {
      setError('Código da empresa inválido. Verifique o código fornecido pela equipe MSys.')
      setLoading(false)
      return
    }

    // 2. Cria o usuário no Supabase Auth
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, role: 'participante' }
      }
    })

    if (signUpErr || !authData.user) {
      setError(signUpErr?.message || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // 3. Aguarda o trigger criar o profile e atualiza com cliente_id
    await new Promise(resolve => setTimeout(resolve, 1000))

    await (supabase as any)
      .from('profiles')
      .update({ cliente_id: cliente.id })
      .eq('id', authData.user.id)

    setSucesso('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.')
    setLoading(false)
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
  const labelCls = "block text-xs text-gray-500 mb-1.5 font-medium"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
               style={{ background: '#3A8C4E' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">MSys Treinamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Plataforma de Capacitação</p>
        </div>

        {/* Abas */}
        <div className="flex mb-4 bg-white border border-gray-200 rounded-xl p-1">
          <button type="button" onClick={() => trocarModo('login')}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: modo === 'login' ? '#3A8C4E' : 'transparent', color: modo === 'login' ? 'white' : '#6b7280' }}>
            Entrar
          </button>
          <button type="button" onClick={() => trocarModo('cadastro')}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: modo === 'cadastro' ? '#3A8C4E' : 'transparent', color: modo === 'cadastro' ? 'white' : '#6b7280' }}>
            Criar conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={modo === 'login' ? handleLogin : handleCadastro}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
              {error}
            </div>
          )}
          {sucesso && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#EBF5EE', color: '#2D6E3E' }}>
              {sucesso}
            </div>
          )}

          {modo === 'cadastro' && (
            <>
              <div className="mb-4">
                <label className={labelCls}>Nome completo</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                       placeholder="Seu nome completo" className={inputCls} />
              </div>

              <div className="mb-4">
                <label className={labelCls}>Código da empresa</label>
                <input type="text" required value={alias}
                       onChange={e => setAlias(e.target.value.toUpperCase())}
                       placeholder="Ex: XK7-M3P2"
                       className={inputCls + " font-mono tracking-widest uppercase"}
                       maxLength={10} />
                <p className="text-xs text-gray-400 mt-1">
                  Código fornecido pela equipe MSys da sua empresa.
                </p>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className={labelCls}>E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                   placeholder="seu@email.com.br" className={inputCls} />
          </div>

          <div className={modo === 'login' ? 'mb-6' : 'mb-4'}>
            <label className={labelCls}>Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="••••••••" className={inputCls} />
          </div>

          {modo === 'cadastro' && (
            <div className="mb-6">
              <label className={labelCls}>Confirmar senha</label>
              <input type="password" required value={confirmar} onChange={e => setConfirmar(e.target.value)}
                     placeholder="••••••••" className={inputCls} />
            </div>
          )}

          <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: loading ? '#7AB889' : '#3A8C4E' }}>
            {loading
              ? (modo === 'login' ? 'Entrando...' : 'Criando conta...')
              : (modo === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        {modo === 'cadastro' && (
          <p className="text-center text-xs text-gray-400 mt-4 px-4">
            Contas de gestor, agente e admin são criadas pela equipe MSys.
          </p>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          MSys Tecnologia · Plataforma de Capacitação
        </p>
      </div>
    </div>
  )
}
