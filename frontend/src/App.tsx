import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Extrato from './pages/Extrato'
import Configuracoes from './pages/Configuracoes'
import Lembretes from './pages/Lembretes'
import Dividas from './pages/Dividas'
import DespesasMensais from './pages/DespesasMensais'
import RendaExtra from './pages/RendaExtra'

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )

  if (!authed) return <Login onAuth={() => setAuthed(true)} />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/extrato" element={<Extrato />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/lembretes" element={<Lembretes />} />
        <Route path="/dividas" element={<Dividas />} />
        <Route path="/despesas" element={<DespesasMensais />} />
        <Route path="/renda-extra" element={<RendaExtra />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
