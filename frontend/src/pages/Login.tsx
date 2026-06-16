import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus, Sparkles, ArrowLeft, KeyRound } from 'lucide-react'

const AVATARES = [
  { value: 'menina-branca', label: 'Menina Branca', img: '/avatars/menina-branca.jpg' },
  { value: 'menina-negra', label: 'Menina Negra', img: '/avatars/menina-negra.jpg' },
  { value: 'menino-branco', label: 'Menino Branco', img: '/avatars/menino-branco.jpg' },
  { value: 'menino-negro', label: 'Menino Negro', img: '/avatars/menino-negro.jpg' },
]

interface LoginProps {
  onAuth: () => void
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function Login({ onAuth }: LoginProps) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('menina-negra')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailAlreadyExists, setEmailAlreadyExists] = useState('')

  const switchToLogin = (emailToUse?: string) => {
    if (emailToUse) setEmail(emailToUse)
    setView('login'); setError(''); setSuccess(''); setEmailAlreadyExists('')
  }

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
      options: { data: { nome: nome.trim(), genero: avatar } },
    })
    if (error) {
      if (/already.*registered|already.*exists|email.*taken/i.test(error.message)) {
        setError('')
        setEmailAlreadyExists(email)
      } else {
        setError(error.message)
      }
    } else {
      setSuccess('Conta criada! Verifique seu email.')
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Digite seu email'); return }
    setLoading(true); setError(''); setSuccess('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setError(error.message)
    else setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
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
        {emailAlreadyExists && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-amber-300 text-sm font-medium mb-1">Email já cadastrado</p>
            <p className="text-white/50 text-xs mb-3">Este email já possui uma conta. Faça login ou entre com Google.</p>
            <button onClick={() => switchToLogin(emailAlreadyExists)}
              className="text-sm text-accent-blue hover:text-accent-blue/80 underline transition-colors">
              Ir para login →
            </button>
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
            <div className="flex justify-end -mt-2">
              <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess('') }}
                className="text-xs text-white/40 hover:text-accent-blue transition-colors">
                Esqueceu a senha?
              </button>
            </div>
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

            <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white hover:bg-white/90 text-gray-800 transition-all duration-200 border border-white/20
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <GoogleIcon />
              {googleLoading ? 'Entrando...' : 'Entrar com Google'}
            </button>

            <button type="button" onClick={() => { setView('signup'); setError(''); setSuccess('') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all duration-200 border border-white/10">
              <UserPlus className="w-4 h-4" />
              Criar nova conta
            </button>
          </form>
        ) : view === 'signup' ? (
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
            <div>
              <label className="block text-sm text-white/50 mb-3">Escolha seu avatar</label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/30 mb-2 text-center">Feminino</p>
                  <div className="flex gap-3 justify-center">
                    {AVATARES.filter(a => a.value.startsWith('menina')).map(a => (
                      <button key={a.value} type="button" onClick={() => setAvatar(a.value)}
                        className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                          avatar === a.value ? 'border-accent-blue scale-110 ring-2 ring-accent-blue/30' : 'border-white/20 opacity-60 hover:opacity-100'
                        }`}>
                        <img src={a.img} alt={a.label} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-2 text-center">Masculino</p>
                  <div className="flex gap-3 justify-center">
                    {AVATARES.filter(a => a.value.startsWith('menino')).map(a => (
                      <button key={a.value} type="button" onClick={() => setAvatar(a.value)}
                        className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                          avatar === a.value ? 'border-accent-blue scale-110 ring-2 ring-accent-blue/30' : 'border-white/20 opacity-60 hover:opacity-100'
                        }`}>
                        <img src={a.img} alt={a.label} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white
                hover:from-[#FF2E9A] hover:to-[#A855F7] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Cadastrando...' : 'Criar conta'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-white/30 bg-transparent">ou</span>
              </div>
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white hover:bg-white/90 text-gray-800 transition-all duration-200 border border-white/20
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <GoogleIcon />
              {googleLoading ? 'Entrando...' : 'Cadastrar com Google'}
            </button>

            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess('') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium
                bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all duration-200 border border-white/10">
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-sm text-white/50 mb-2">Digite seu email para receber o link de redefinição de senha.</p>
            <input type="email" required placeholder="Seu email"
              className="input-glass" value={email}
              onChange={e => setEmail(e.target.value)} />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white
                hover:from-[#FF2E9A] hover:to-[#A855F7] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <KeyRound className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Redefinir senha'}
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
