import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao, Conta, Investimento } from '../types'
import { TIPOS_CONTA } from '../types'
import { Save, Bell, User, Building2, Plus, Trash2, Pencil } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

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
  const [genero, setGenero] = useState('menina-negra')

  const AVATARES = [
    { value: 'menina-branca', label: 'Menina Branca', img: '/avatars/menina-branca.jpg' },
    { value: 'menina-negra', label: 'Menina Negra', img: '/avatars/menina-negra.jpg' },
    { value: 'menino-branco', label: 'Menino Branco', img: '/avatars/menino-branco.jpg' },
    { value: 'menino-negro', label: 'Menino Negro', img: '/avatars/menino-negro.jpg' },
  ]

  const [contas, setContas] = useState<Conta[]>([])
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [showContaForm, setShowContaForm] = useState(false)
  const [contaNome, setContaNome] = useState('')
  const [contaTipo, setContaTipo] = useState('corrente')
  const [contaSaldo, setContaSaldo] = useState('')
  const [contaEditId, setContaEditId] = useState<number | null>(null)
  const [deleteContaId, setDeleteContaId] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUsuarioId(data.user.id)
        setProfileNome((data.user.user_metadata?.nome as string) || 'Larissa')
        setProfileEmail(data.user.email || '')
        setGenero((data.user.user_metadata?.genero as string) || 'menina-negra')
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
    carregarContas()
    supabase.from('investimentos').select('*').then(({ data }) => setInvestimentos(data || []))
  }, [])

  async function carregarContas() {
    const { data } = await supabase.from('contas').select('*').order('created_at', { ascending: false })
    setContas(data || [])
  }

  function resetContaForm() { setContaNome(''); setContaTipo('corrente'); setContaSaldo(''); setContaEditId(null) }

  async function handleContaSave() {
    if (!usuarioId || !contaNome) return
    const payload = { nome: contaNome, tipo: contaTipo, saldo: Number(contaSaldo || 0) }
    if (contaEditId) {
      await supabase.from('contas').update(payload).eq('id', contaEditId)
    } else {
      await supabase.from('contas').insert({ ...payload, usuario_id: usuarioId })
    }
    resetContaForm(); setShowContaForm(false); carregarContas()
  }

  async function handleDeleteConta() {
    if (!deleteContaId) return
    await supabase.from('contas').delete().eq('id', deleteContaId)
    setDeleteContaId(null); carregarContas()
  }

  function editConta(c: Conta) {
    setContaNome(c.nome); setContaTipo(c.tipo); setContaSaldo(String(c.saldo))
    setContaEditId(c.id); setShowContaForm(true)
  }

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
      data: { nome, genero }
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
  const salarioNum = parseFloat(salario) || 0
  const receitasTotal = salarioNum + totalRec
  const totalInvestido = investimentos.reduce((s, i) => s + Number(i.valor_investido), 0)
  const totalAtual = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0)
  const saldoBancario = contas.reduce((s, c) => s + Number(c.saldo), 0)
  const patrimonioLiquido = totalAtual + saldoBancario
  const percGasto = salarioNum > 0 ? (totalDesp / salarioNum) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <form onSubmit={handleProfileSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Perfil
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 shrink-0">
            <img src={`/avatars/${genero}.jpg`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Nome</label>
              <input type="text" placeholder="Seu nome"
                className="input-glass" value={profileNome}
                onChange={e => setProfileNome(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">Avatar</label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/30 mb-2">Feminino</p>
                  <div className="flex gap-3">
                    {AVATARES.filter(a => a.value.startsWith('menina')).map(a => (
                      <button key={a.value} type="button" onClick={() => setGenero(a.value)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                          genero === a.value ? 'border-accent-blue scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                        }`}>
                        <img src={a.img} alt={a.label} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-2">Masculino</p>
                  <div className="flex gap-3">
                    {AVATARES.filter(a => a.value.startsWith('menino')).map(a => (
                      <button key={a.value} type="button" onClick={() => setGenero(a.value)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                          genero === a.value ? 'border-accent-blue scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                        }`}>
                        <img src={a.img} alt={a.label} className="w-full h-full object-cover rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Contas Bancárias
        </h2>

        {contas.length > 0 && (
          <div className="space-y-2">
            {contas.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{c.nome}</p>
                  <span className="text-xs text-white/40">{TIPOS_CONTA.find(t => t.value === c.tipo)?.label || c.tipo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-accent-blue">{formatar(Number(c.saldo))}</span>
                  <button onClick={() => editConta(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-accent-blue transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteContaId(c.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-accent-pink transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showContaForm && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/5">
            <div>
              <label className="block text-xs text-white/60 mb-1">Nome</label>
              <input value={contaNome} onChange={e => setContaNome(e.target.value)}
                className="input-glass" placeholder="Ex: Nubank" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Tipo</label>
              <select value={contaTipo} onChange={e => setContaTipo(e.target.value)} className="select-glass">
                {TIPOS_CONTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Saldo (R$)</label>
              <input type="number" step="0.01" value={contaSaldo} onChange={e => setContaSaldo(e.target.value)}
                className="input-glass" placeholder="0,00" />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button onClick={() => { resetContaForm(); setShowContaForm(false) }} className="btn-outline text-sm">Cancelar</button>
              <button onClick={handleContaSave} className="btn-primary text-sm">{contaEditId ? 'Atualizar' : 'Adicionar'}</button>
            </div>
          </div>
        )}

        {!showContaForm && (
          <button onClick={() => { resetContaForm(); setShowContaForm(true) }}
            className="btn-outline w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Adicionar Conta
          </button>
        )}
      </div>

      <ConfirmDialog
        open={deleteContaId !== null}
        title="Excluir conta?"
        message="Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConta}
        onCancel={() => setDeleteContaId(null)}
      />

      <form onSubmit={handleNotifSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notificações por Email
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={notifAtivo} onChange={e => setNotifAtivo(e.target.checked)}
            className="w-5 h-5 accent-accent-blue" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card metric-card-receita">
              <div className="metric-label text-accent-blue/60 mb-1">Total Receitas</div>
              <div className="metric-value text-accent-blue">{formatar(receitasTotal)}</div>
              <div className="text-xs text-white/30 mt-1">Salário + Extras</div>
            </div>
            <div className="metric-card">
              <div className="metric-label text-white/40 mb-1">Total Investido</div>
              <div className="metric-value text-white">{formatar(totalInvestido)}</div>
            </div>
            <div className="metric-card metric-card-despesa">
              <div className="metric-label text-accent-pink/60 mb-1">Total Despesas</div>
              <div className="metric-value text-despesa">{formatar(totalDesp)}</div>
            </div>
            <div className={`metric-card ${patrimonioLiquido >= 0 ? 'metric-card-receita' : 'metric-card-despesa'}`}>
              <div className={`metric-label mb-1 ${patrimonioLiquido >= 0 ? 'text-accent-blue/60' : 'text-accent-pink/60'}`}>Patrimônio Líquido</div>
              <div className={`metric-value ${patrimonioLiquido >= 0 ? 'text-accent-blue' : 'text-accent-pink'}`}>
                {formatar(patrimonioLiquido)}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-white/70 mb-3">📊 Gastos vs Salário</h3>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${percGasto > 100 ? 'bg-accent-pink' : 'bg-accent-blue'}`}
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
