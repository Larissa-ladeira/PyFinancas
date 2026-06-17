import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Onboarding from './components/Onboarding'
import Dashboard from './pages/Dashboard'
import Extrato from './pages/Extrato'
import Configuracoes from './pages/Configuracoes'

import Dividas from './pages/Dividas'
import DespesasMensais from './pages/DespesasMensais'
import RendaExtra from './pages/RendaExtra'
import Acordos from './pages/Acordos'
import MetasEconomia from './pages/MetasEconomia'

import CalendarioFinanceiro from './pages/CalendarioFinanceiro'
import Relatorios from './pages/Relatorios'
import Investimentos from './pages/Investimentos'

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      if (session) {
        supabase.from('configuracoes').select('salario_base').single()
          .then(({ data }) => {
            if (!data || !data.salario_base) {
              supabase.from('transacoes').select('id').limit(1).then(({ data: tx }) => {
                if (!tx?.length) setShowOnboarding(true)
              })
            }
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
      if (session) {
        supabase.from('configuracoes').select('salario_base').single()
          .then(({ data }) => {
            if (!data || !data.salario_base) setShowOnboarding(true)
          })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06032D]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-blue border-t-transparent" />
        <p className="text-white/50 text-sm">Carregando...</p>
      </div>
    </div>
  )

  if (!authed) return <Login onAuth={() => setAuthed(true)} />

  if (showOnboarding) return <Onboarding onComplete={() => setShowOnboarding(false)} />

  return (
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

        <Route path="/calendario" element={<CalendarioFinanceiro />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/investimentos" element={<Investimentos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
