import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ListOrdered, Settings,
  LogOut, Menu, DollarSign, Bell, PiggyBank, TrendingDown, TrendingUp, Handshake
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/despesas', label: 'Despesas', icon: TrendingDown },
  { to: '/renda-extra', label: 'Renda Extra', icon: TrendingUp },
  { to: '/lembretes', label: 'Lembretes', icon: Bell },
  { to: '/dividas', label: 'Desfudência', icon: PiggyBank },
  { to: '/acordos', label: 'Acordos', icon: Handshake },
  { to: '/extrato', label: 'Extrato', icon: ListOrdered },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const bottomLinks = links.slice(0, 5)

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [userDisplay, setUserDisplay] = useState('')

  const pageTitle = links.find(l => l.to === location.pathname)?.label || 'PyFinanças'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const nome = data.user.user_metadata?.nome as string | undefined
        setUserDisplay(nome || data.user.email || '')
      }
    })
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
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#763EC0]/20 border border-[#9966DC]/30
                flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#B894E2]" />
              </div>
              <span className="font-bold text-lg text-white">PyFinanças</span>
            </div>
            <p className="text-sm text-white/40 mt-2 truncate">{userDisplay}</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to} end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent'}`
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
                text-white/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 w-full">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>

        <nav className="bottom-nav lg:hidden">
          {bottomLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[11px] font-medium transition-all duration-200
                ${isActive ? 'text-[#B894E2]' : 'text-white/40 hover:text-white/70'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
