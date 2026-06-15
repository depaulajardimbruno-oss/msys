import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')
  // Gestores podem acessar o portal também (para visualizar como participante)
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role="participante" userName={profile.nome} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
