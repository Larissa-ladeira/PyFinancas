import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { AuthSession } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Onboarding from './components/Onboarding'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Extrato from './pages/Extrato'
import Configuracoes from './pages/Configuracoes'

import Dividas from './pages/Dividas'
import DespesasMensais from './pages/DespesasMensais'
import RendaExtra from './pages/RendaExtra'
import Acordos from './pages/Acordos'
import MetasEconomia from './pages/MetasEconomia'
import Lembretes from './pages/Lembretes'
import TransacoesRecorrentes from './pages/TransacoesRecorrentes'

import CalendarioFinanceiro from './pages/CalendarioFinanceiro'
import Relatorios from './pages/Relatorios'
import Investimentos from './pages/Investimentos'

type AuthState = 'loading' | 'loggedOut' | 'mfa' | 'authed'

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const onboardingChecked = useRef(false)

  const checkOnboarding = useCallback(() => {
    if (onboardingChecked.current) return
    onboardingChecked.current = true
    supabase.from('configuracoes').select('salario_base').single()
      .then(({ data }) => {
        if (!data || !data.salario_base) {
          supabase.from('transacoes').select('id').limit(1).then(({ data: tx }) => {
            if (!tx?.length) setShowOnboarding(true)
          })
        }
      })
  }, [])

  const refreshAuthState = useCallback(async (session: AuthSession | null) => {
    if (!session) {
      setAuthState('loggedOut')
      return
    }
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') {
        setAuthState('authed')
        checkOnboarding()
        return
      }
      if (aal?.nextLevel === 'aal2') {
        setAuthState('mfa')
        return
      }
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasVerifiedFactor =
        (factors?.totp.length ?? 0) +
        (factors?.phone.length ?? 0) +
        (factors?.webauthn.length ?? 0) > 0
      if (hasVerifiedFactor) {
        setAuthState('mfa')
      } else {
        setAuthState('authed')
        checkOnboarding()
      }
    } catch {
      setAuthState('authed')
      checkOnboarding()
    }
  }, [checkOnboarding])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) refreshAuthState(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      refreshAuthState(session)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [refreshAuthState])

  if (authState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-blue border-t-transparent" />
        <p className="text-white/50 text-sm">Carregando...</p>
      </div>
    </div>
  )

  if (authState === 'loggedOut') return <Login onAuth={() => setAuthState('authed')} />

  if (authState === 'mfa') return <Login onAuth={() => setAuthState('authed')} mfaRequired />

  if (showOnboarding) return <Onboarding onComplete={() => setShowOnboarding(false)} />

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/extrato" element={<Extrato />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          <Route path="/dividas" element={<Dividas />} />
          <Route path="/despesas" element={<DespesasMensais />} />
          <Route path="/renda-extra" element={<RendaExtra />} />
          <Route path="/acordos" element={<Acordos />} />
          <Route path="/metas" element={<MetasEconomia />} />
          <Route path="/lembretes" element={<Lembretes />} />
          <Route path="/transacoes-recorrentes" element={<TransacoesRecorrentes />} />

          <Route path="/calendario" element={<CalendarioFinanceiro />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/investimentos" element={<Investimentos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}
