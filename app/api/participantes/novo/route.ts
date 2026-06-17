import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  // 1. Confirma que quem está chamando é um gestor autenticado.
  // Isso usa o client "normal" (anon key + cookies), então respeita a sessão real do usuário.
  const supabaseAuth = createSupabaseServer()
  const { data: { session } } = await supabaseAuth.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'gestor') {
    return NextResponse.json({ error: 'Apenas gestores podem cadastrar participantes.' }, { status: 403 })
  }

  // 2. Valida o corpo da requisição.
  const body = await req.json().catch(() => null)
  const nome = body?.nome?.trim()
  const email = body?.email?.trim()
  const clienteId = body?.cliente_id

  if (!nome || !email || !clienteId) {
    return NextResponse.json({ error: 'Nome, e-mail e cliente são obrigatórios.' }, { status: 400 })
  }

  // 3. Confirma que o cliente existe (evita criar participante "solto").
  const { data: cliente } = await supabaseAuth
    .from('clientes')
    .select('id, nome')
    .eq('id', clienteId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
  }

  // 4. Usa a service_role key (só existe no servidor, nunca exposta ao browser)
  // para criar o usuário direto no Auth, já com e-mail confirmado e sem
  // depender do fluxo público de signup.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Configuração ausente no servidor: SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const senha = gerarSenha()

  const { data: novoUsuario, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role: 'participante' },
  })

  if (createErr) {
    const msg = createErr.message?.toLowerCase().includes('already registered') ||
                createErr.message?.toLowerCase().includes('already been registered')
      ? 'Este e-mail já está cadastrado.'
      : 'Erro ao criar conta: ' + createErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!novoUsuario.user) {
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
  }

  // 5. O trigger handle_new_user() já cria a linha em "profiles" automaticamente.
  // Aqui vinculamos o cliente_id, usando o client admin para não depender de RLS.
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ cliente_id: clienteId, nome })
    .eq('id', novoUsuario.user.id)

  if (updateErr) {
    return NextResponse.json(
      { error: 'Conta criada, mas falhou ao vincular à empresa: ' + updateErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    email,
    senha,
    cliente_nome: cliente.nome,
  })
}
