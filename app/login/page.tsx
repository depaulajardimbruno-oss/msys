'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('E-mail ou senha incorretos.'); setLoading(false); return }

    // Busca role para redirecionar corretamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Aguarda o cookie ser salvo antes de redirecionar
    await new Promise(resolve => setTimeout(resolve, 500))

    if (profile?.role === 'gestor') {
      window.location.replace('/dashboard')
    } else {
      window.location.replace('/portal')
    }
  }

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
          <p className="text-sm text-gray-500 mt-1">Acesse sua conta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm"
                 style={{ background: '#FCEBEB', color: '#A32D2D' }}>
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com.br"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: loading ? '#7AB889' : '#3A8C4E' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          MSys Tecnologia · Plataforma de Capacitação
        </p>
      </div>
    </div>
  )
}
