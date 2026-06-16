import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ListOrdered, Settings,
  LogOut, Menu, DollarSign, Bell, PiggyBank, TrendingDown, TrendingUp, Handshake, Target, Repeat,
  CalendarDays, BarChart3, TrendingUp as InvestmentIcon
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/despesas', label: 'Despesas', icon: TrendingDown },
  { to: '/renda-extra', label: 'Renda Extra', icon: TrendingUp },
  { to: '/lembretes', label: 'Lembretes', icon: Bell },
  { to: '/dividas', label: 'Desfudência', icon: PiggyBank },
  { to: '/acordos', label: 'Acordos', icon: Handshake },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/recorrentes', label: 'Recorrentes', icon: Repeat },
  { to: '/investimentos', label: 'Investimentos', icon: InvestmentIcon },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/extrato', label: 'Extrato', icon: ListOrdered },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitle = links.find(l => l.to === location.pathname)?.label || 'PyFinanças'

  const [userNome, setUserNome] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userGenero, setUserGenero] = useState('feminino')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserNome((data.user.user_metadata?.nome as string) || '')
        setUserEmail(data.user.email || '')
        setUserGenero((data.user.user_metadata?.genero as string) || 'feminino')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserNome((session.user.user_metadata?.nome as string) || '')
        setUserEmail(session.user.email || '')
        setUserGenero((session.user.user_metadata?.genero as string) || 'feminino')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64
        glass border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-accent-pink/20 border border-accent-purple/30
                flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-pink" />
              </div>
              <span className="font-bold text-lg text-white">PyFinanças</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                {userGenero === 'feminino' ? (
                  <img src="/avatars/feminino.jpg" alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <DollarSign className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userNome || 'Larissa'}</p>
                <p className="text-xs text-white/40 truncate mt-0.5">{userEmail}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to} end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/20'
                    : 'text-white/50 hover:bg-gradient-to-r hover:from-accent-blue/20 hover:to-accent-purple/20 hover:text-white'}`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-white/10">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-white/40 hover:text-accent-pink hover:bg-accent-pink/10 transition-all duration-200 w-full">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 glass border-b border-white/10 lg:hidden">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => setOpen(true)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/10 text-white/70">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-white">{pageTitle}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-8">
          {children}
        </main>


      </div>
    </div>
  )
}
