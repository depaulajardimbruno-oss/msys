'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, BookOpen, Calendar, Building2,
  RefreshCw, User, Star, BarChart2, LogOut, Zap, Users
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  section?: string
}

const gestorNav: NavItem[] = [
  { section: 'Gestão', href: '/dashboard',      label: 'Dashboard',     icon: <LayoutDashboard size={16}/> },
  {                    href: '/treinamentos',    label: 'Treinamentos',  icon: <BookOpen size={16}/> },
  {                    href: '/calendario',      label: 'Calendário',    icon: <Calendar size={16}/> },
  {                    href: '/clientes',        label: 'Clientes',      icon: <Building2 size={16}/> },
  {                    href: '/participantes',     label: 'Participantes', icon: <Users size={16}/> },
  {                    href: '/revalidacoes',    label: 'Revalidações',  icon: <RefreshCw size={16}/> },
  { section: 'Análise',href: '/relatorios',     label: 'Relatórios',    icon: <BarChart2 size={16}/> },
]

const participanteNav: NavItem[] = [
  { section: 'Meu treinamento', href: '/portal',     label: 'Meu Treinamento', icon: <User size={16}/> },
  {                              href: '/avaliacao',  label: 'Avaliação',       icon: <Star size={16}/> },
]

interface SidebarProps {
  role: 'gestor' | 'participante'
  userName: string
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const nav      = role === 'gestor' ? gestorNav : participanteNav

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  let lastSection = ''

  return (
    <aside className="w-[210px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5 border-b-2" style={{ borderColor: '#3A8C4E' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: '#3A8C4E' }}>
          <Zap size={14} color="white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">MSys Treinamentos</div>
          <div className="text-[9px] tracking-wider font-medium" style={{ color: '#3A8C4E' }}>
            GESTÃO DE CAPACITAÇÃO
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {nav.map((item) => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          const active = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <div key={item.href}>
              {showSection && (
                <p className="text-[9px] uppercase tracking-widest text-gray-400 px-4 pt-3 pb-1 font-medium">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-xs transition-colors border-l-[3px]"
                style={{
                  borderLeftColor: active ? '#3A8C4E' : 'transparent',
                  background: active ? '#EBF5EE' : 'transparent',
                  color: active ? '#2D6E3E' : '#6b7280',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <div className="text-xs text-gray-500 mb-2 px-1 truncate">{userName}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 px-1 py-1 w-full transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
