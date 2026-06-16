import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'

interface LoginProps {
  onAuth: () => void
}

export default function Login({ onAuth }: LoginProps) {
  const [view, setView] = useState<'login' | 'signup'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message); else onAuth()
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) { setError('Preencha seu nome'); setLoading(false); return }
    setLoading(true); setError(''); setSuccess('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome: nome.trim() } },
    })
    if (error) setError(error.message); else setSuccess('Conta criada! Verifique seu email.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 80% 20%, rgba(118,62,192,0.5), transparent 40%),
          radial-gradient(circle at 20% 80%, rgba(58,0,112,0.5), transparent 40%)
        `
      }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
            bg-gradient-to-br from-[var(--accent-pink)]/30 to-[var(--accent-purple)]/20 border border-[var(--accent-purple)]/30 mb-5 shadow-lg shadow-[var(--accent-pink)]/20">
            <Sparkles className="w-8 h-8 text-accent-pink" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PyFinanças</h1>
          <p className="text-white/40 text-sm mt-2">Controle suas finanças de forma simples</p>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

        {error && (
          <div className="bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm rounded-xl p-3 mb-4">
            {success}
          </div>
        )}

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" required placeholder="Seu email"
              className="input-glass" value={email}
              onChange={e => setEmail(e.target.value)} />
            <input type="password" required placeholder="Senha"
              className="input-glass" value={password}
              onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white
                hover:from-[#FF2E9A] hover:to-[#A855F7] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <LogIn className="w-4 h-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-white/30 bg-transparent">ou</span>
              </div>
            </div>

            <button type="button" onClick={() => { setView('signup'); setError(''); setSuccess('') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all duration-200 border border-white/10">
              <UserPlus className="w-4 h-4" />
              Criar nova conta
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <input type="text" required placeholder="Seu nome"
              className="input-glass" value={nome}
              onChange={e => setNome(e.target.value)} />
            <input type="email" required placeholder="Seu email"
              className="input-glass" value={email}
              onChange={e => setEmail(e.target.value)} />
            <input type="password" required placeholder="Senha"
              className="input-glass" value={password}
              onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white
                hover:from-[#FF2E9A] hover:to-[#A855F7] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Cadastrando...' : 'Criar conta'}
            </button>

            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess('') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all duration-200 border border-white/10">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </button>
          </form>
        )}
      </div>
    </div>
    </div>
  )
}
