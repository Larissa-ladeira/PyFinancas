import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus, DollarSign, ArrowLeft } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
            bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <DollarSign className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">PyFinanças</h1>
          <p className="text-white/40 text-sm mt-1">Controle suas finanças de forma simples</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl p-3 mb-4">
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
              className="btn-primary w-full flex items-center justify-center gap-2">
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
              className="btn-outline w-full flex items-center justify-center gap-2">
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
              className="btn-primary w-full flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Cadastrando...' : 'Criar conta'}
            </button>

            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess('') }}
              className="btn-outline w-full flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
