import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { Save, Bell, User } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Configuracoes() {
  const [salario, setSalario] = useState('')
  const [configId, setConfigId] = useState<number | null>(null)
  const [todas, setTodas] = useState<Transacao[]>([])
  const [saved, setSaved] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  const [notifAtivo, setNotifAtivo] = useState(false)
  const [notifEmail, setNotifEmail] = useState('')
  const [notifDias, setNotifDias] = useState(1)
  const [notifId, setNotifId] = useState<number | null>(null)
  const [notifSaved, setNotifSaved] = useState(false)

  const [profileNome, setProfileNome] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUsuarioId(data.user.id)
        setProfileNome((data.user.user_metadata?.nome as string) || 'Larissa')
        setProfileEmail(data.user.email || '')
      }
    })
    supabase.from('configuracoes').select('*').single().then(({ data }) => {
      if (data) { setSalario(String(data.salario_base)); setConfigId(data.id) }
    })
    supabase.from('transacoes').select('*').then(({ data }) => setTodas(data || []))
    supabase.from('notificacoes').select('*').single().then(({ data }) => {
      if (data) {
        setNotifAtivo(data.ativo)
        setNotifEmail(data.email_notificacao || '')
        setNotifDias(data.dias_antes)
        setNotifId(data.id)
      }
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(salario) || 0
    if (configId) await supabase.from('configuracoes').update({ salario_base: valor }).eq('id', configId)
    else await supabase.from('configuracoes').insert({ salario_base: valor, usuario_id: usuarioId })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const nome = profileNome.trim() || 'Larissa'
    setProfileNome(nome)
    const { error } = await supabase.auth.updateUser({
      data: { nome }
    })
    if (!error) {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    }
  }

  const handleNotifSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ativo: notifAtivo,
      email_notificacao: notifEmail || null,
      dias_antes: notifDias,
    }
    if (notifId) await supabase.from('notificacoes').update(payload).eq('id', notifId)
    else await supabase.from('notificacoes').insert({ ...payload, usuario_id: usuarioId })
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  const totalRec = todas.filter(t => t.tipo.toLowerCase() === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const totalDesp = todas.filter(t => t.tipo.toLowerCase() === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  const economia = totalRec - totalDesp
  const salarioNum = parseFloat(salario) || 0
  const percGasto = salarioNum > 0 ? (totalDesp / salarioNum) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <form onSubmit={handleProfileSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Perfil
        </h2>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Nome</label>
          <input type="text" placeholder="Seu nome"
            className="input-glass" value={profileNome}
            onChange={e => setProfileNome(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
          <input type="email" disabled
            className="input-glass opacity-60" value={profileEmail} />
        </div>
        <button type="submit" className="btn-primary flex items-center justify-center gap-2">
          <User className="w-4 h-4" />
          {profileSaved ? 'Salvo!' : 'Salvar Perfil'}
        </button>
      </form>

      <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">💼 Salário Base</label>
          <input type="number" step="0.01" min="0" placeholder="Ex: 5000,00"
            className="input-glass" value={salario} onChange={e => setSalario(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </form>

      <form onSubmit={handleNotifSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notificações por Email
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={notifAtivo} onChange={e => setNotifAtivo(e.target.checked)}
            className="w-5 h-5 accent-emerald-500" />
          <span className="text-sm text-white/70">Ativar notificações de lembretes</span>
        </label>

        {notifAtivo && (
          <>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email para notificações</label>
              <input type="email" placeholder="seu@email.com"
                className="input-glass" value={notifEmail}
                onChange={e => setNotifEmail(e.target.value)} />
              <p className="text-xs text-white/30 mt-1">Deixe em branco para usar o email da conta</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Notificar dias antes do vencimento</label>
              <input type="number" min="1" max="30"
                className="input-glass" value={notifDias}
                onChange={e => setNotifDias(Math.max(1, Number(e.target.value)))} />
            </div>
          </>
        )}

        <button type="submit" className="btn-primary flex items-center justify-center gap-2">
          <Bell className="w-4 h-4" />
          {notifSaved ? 'Salvo!' : 'Salvar Notificações'}
        </button>
      </form>

      {salarioNum > 0 && todas.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label text-white/40 mb-1">Salário Base</div>
              <div className="metric-value text-white">{formatar(salarioNum)}</div>
            </div>
            <div className="metric-card metric-card-receita">
              <div className="metric-label text-emerald-300/60 mb-1">Total Receitas</div>
              <div className="metric-value text-emerald-300">{formatar(totalRec)}</div>
            </div>
            <div className="metric-card metric-card-despesa">
              <div className="metric-label text-rose-300/60 mb-1">Total Despesas</div>
              <div className="metric-value text-despesa">{formatar(totalDesp)}</div>
            </div>
            <div className="metric-card metric-card-saldo">
              <div className="metric-label text-cyan-300/60 mb-1">Economia</div>
              <div className={`metric-value ${economia >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
                {formatar(economia)}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-white/70 mb-3">📊 Gastos vs Salário</h3>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${percGasto > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(percGasto, 100)}%` }} />
            </div>
            <p className="text-sm text-white/40 mt-2">
              Você já gastou <strong className="text-white/70">{percGasto.toFixed(1)}%</strong> do seu salário em despesas
            </p>
          </div>
        </>
      )}
    </div>
  )
}
