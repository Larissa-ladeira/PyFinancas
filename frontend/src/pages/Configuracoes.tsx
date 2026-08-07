import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatar } from '../lib/format'
import type { Transacao, Conta, Investimento } from '../types'
import { TIPOS_CONTA } from '../types'
import { Save, Bell, User, Building2, Plus, Trash2, Pencil, DollarSign, ShieldCheck, ShieldOff } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Configuracoes() {
  const [salario, setSalario] = useState('')
  const [salarioReal, setSalarioReal] = useState('')
  const [temValeAlimentacao, setTemValeAlimentacao] = useState(true)
  const [valeAlimentacao, setValeAlimentacao] = useState('')
  const [temRefeicao, setTemRefeicao] = useState(true)
  const [refeicao, setRefeicao] = useState('')
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

  const [mfaStatus, setMfaStatus] = useState<'loading' | 'off' | 'on' | 'enrolling'>('loading')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaEnrollId, setMfaEnrollId] = useState<string | null>(null)
  const [mfaQr, setMfaQr] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMsg, setMfaMsg] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [confirmMfaDisable, setConfirmMfaDisable] = useState(false)

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
      if (data) {
        setSalario(String(data.salario_base))
        setSalarioReal(String(data.salario_real ?? ''))
        setTemValeAlimentacao(data.tem_vale_alimentacao ?? true)
        setValeAlimentacao(String(data.vale_alimentacao ?? ''))
        setTemRefeicao(data.tem_refeicao ?? true)
        setRefeicao(String(data.refeicao ?? ''))
        setConfigId(data.id)
      }
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
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified')
      if (verified) {
        setMfaFactorId(verified.id)
        setMfaStatus('on')
      } else {
        setMfaStatus('off')
      }
    })
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
    const payload = {
      salario_base: parseFloat(salario) || 0,
      salario_real: parseFloat(salarioReal) || 0,
      tem_vale_alimentacao: temValeAlimentacao,
      vale_alimentacao: temValeAlimentacao ? (parseFloat(valeAlimentacao) || 0) : 0,
      tem_refeicao: temRefeicao,
      refeicao: temRefeicao ? (parseFloat(refeicao) || 0) : 0,
    }
    if (configId) await supabase.from('configuracoes').update(payload).eq('id', configId)
    else await supabase.from('configuracoes').insert({ ...payload, usuario_id: usuarioId })
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

  async function handleMfaEnroll() {
    setMfaError(''); setMfaMsg('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) { setMfaError(error.message); return }
    setMfaEnrollId(data.id)
    setMfaQr(data.totp.qr_code)
    setMfaSecret(data.totp.secret)
    setMfaCode('')
    setMfaStatus('enrolling')
  }

  async function handleMfaVerifyEnroll() {
    if (!mfaEnrollId) return
    setMfaError(''); setMfaMsg('')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaEnrollId, code: mfaCode })
    if (error) { setMfaError(error.message); return }
    setMfaFactorId(mfaEnrollId)
    setMfaStatus('on')
    setMfaQr(''); setMfaSecret(''); setMfaCode('')
    setMfaMsg('Autenticação em duas etapas ativada!')
  }

  async function handleMfaDisable() {
    if (!mfaFactorId) return
    setMfaError(''); setMfaMsg('')
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
    if (error) { setMfaError(error.message); return }
    setMfaFactorId(null)
    setMfaStatus('off')
    setConfirmMfaDisable(false)
    setMfaMsg('Autenticação em duas etapas desativada.')
  }

  const totalRec = todas.filter(t => t.tipo.toLowerCase() === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()
  const despesasMes = todas.filter(t =>
    t.tipo.toLowerCase() === 'despesa' &&
    new Date(t.data_transacao).getMonth() + 1 === mesAtual &&
    new Date(t.data_transacao).getFullYear() === anoAtual
  ).reduce((s, t) => s + Number(t.valor), 0)
  const salarioNum = parseFloat(salario) || 0
  const salarioRealNum = parseFloat(salarioReal) || 0
  const valeAlimentacaoNum = temValeAlimentacao ? (parseFloat(valeAlimentacao) || 0) : 0
  const refeicaoNum = temRefeicao ? (parseFloat(refeicao) || 0) : 0
  const receitasTotal = salarioRealNum + totalRec + valeAlimentacaoNum + refeicaoNum
  const totalInvestido = investimentos.reduce((s, i) => s + Number(i.valor_investido), 0)
  const totalAtual = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0)
  const saldoBancario = contas.reduce((s, c) => s + Number(c.saldo), 0)
  const patrimonioLiquido = totalAtual + saldoBancario
  const percGasto = receitasTotal > 0 ? (despesasMes / receitasTotal) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <form onSubmit={handleProfileSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Perfil
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 shrink-0">
            <img src={`/avatars/${genero}.jpg`} alt="Avatar" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = '/avatars/menina-negra.jpg' }} />
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
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Rendimentos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Salário Base</label>
            <input type="number" step="0.01" min="0" placeholder="Ex: 5000,00"
              className="input-glass" value={salario} onChange={e => setSalario(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Salário Real</label>
            <input type="number" step="0.01" min="0" placeholder="Ex: 4500,00"
              className="input-glass" value={salarioReal} onChange={e => setSalarioReal(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={temValeAlimentacao}
                onChange={e => setTemValeAlimentacao(e.target.checked)}
                className="w-4 h-4 accent-accent-blue" />
              <span className="text-sm font-medium text-white/60">Vale Alimentação</span>
            </label>
            {temValeAlimentacao && (
              <input type="number" step="0.01" min="0" placeholder="Ex: 600,00"
                className="input-glass" value={valeAlimentacao}
                onChange={e => setValeAlimentacao(e.target.value)} />
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={temRefeicao}
                onChange={e => setTemRefeicao(e.target.checked)}
                className="w-4 h-4 accent-accent-blue" />
              <span className="text-sm font-medium text-white/60">Refeição</span>
            </label>
            {temRefeicao && (
              <input type="number" step="0.01" min="0" placeholder="Ex: 400,00"
                className="input-glass" value={refeicao}
                onChange={e => setRefeicao(e.target.value)} />
            )}
          </div>
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

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Segurança
        </h2>

        {mfaError && (
          <div className="bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-sm rounded-xl p-3">
            {mfaError}
          </div>
        )}
        {mfaMsg && (
          <div className="bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm rounded-xl p-3">
            {mfaMsg}
          </div>
        )}

        {mfaStatus === 'loading' && <p className="text-sm text-white/40">Verificando...</p>}

        {mfaStatus === 'off' && (
          <div>
            <p className="text-sm text-white/60 mb-3">
              Proteja sua conta exigindo um código do aplicativo autenticador além da senha na hora do login.
            </p>
            <ol className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>Instale o <strong className="text-white/70">Google Authenticator</strong> (ou Authy) no seu celular.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Toque em <strong className="text-white/70">Ativar 2 etapas</strong> — vai aparecer um QR code na tela.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>No app do celular, toque em <strong className="text-white/70">+ → Escanear código QR</strong> e aponte a câmera para a tela do computador.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                <span>Digite no site o código de <strong className="text-white/70">6 dígitos</strong> que o app mostrar. Pronto!</span>
              </li>
            </ol>
            <button type="button" onClick={handleMfaEnroll}
              className="btn-primary flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Ativar 2 etapas
            </button>
          </div>
        )}

        {mfaStatus === 'enrolling' && (
          <div className="space-y-4">
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>No celular, abra o app autenticador e toque em <strong className="text-white/70">+ → Escanear código QR</strong>.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>Aponte a câmera para o QR code abaixo (ou digite a chave manualmente).</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>Digite o código de <strong className="text-white/70">6 dígitos</strong> do app e toque em <strong className="text-white/70">Confirmar código</strong>.</span>
              </li>
            </ol>
            {mfaQr && (
              <div className="flex justify-center bg-white p-3 rounded-xl w-fit mx-auto">
                <img src={mfaQr} alt="QR code do autenticador" className="w-48 h-48" />
              </div>
            )}
            {mfaSecret && (
              <p className="text-center text-xs text-white/40">
                Chave: <span className="font-mono text-white/70">{mfaSecret}</span>
              </p>
            )}
            <input type="text" inputMode="numeric" autoFocus maxLength={6} placeholder="000000"
              className="input-glass text-center tracking-[0.5em] text-lg" value={mfaCode}
              onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { setMfaStatus('off'); setMfaQr(''); setMfaSecret(''); setMfaCode(''); setMfaError('') }}
                className="btn-outline text-sm flex-1">Cancelar</button>
              <button type="button" disabled={mfaCode.length !== 6} onClick={handleMfaVerifyEnroll}
                className="btn-primary text-sm flex-1">Confirmar código</button>
            </div>
          </div>
        )}

        {mfaStatus === 'on' && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Autenticação em duas etapas</p>
              <p className="text-xs text-white/40 mt-0.5">Ativa · exige código do autenticador no login</p>
            </div>
            <button type="button" onClick={() => setConfirmMfaDisable(true)}
              className="btn-outline text-sm flex items-center gap-2 shrink-0">
              <ShieldOff className="w-4 h-4" /> Desativar
            </button>
          </div>
        )}

        <ConfirmDialog
          open={confirmMfaDisable}
          title="Desativar 2 etapas?"
          message="Sua conta ficará protegida apenas pela senha."
          onConfirm={handleMfaDisable}
          onCancel={() => setConfirmMfaDisable(false)}
        />
      </div>

      {salarioNum > 0 && todas.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card metric-card-receita">
              <div className="metric-label text-accent-blue/60 mb-1">Total Receitas</div>
              <div className="metric-value !text-2xl text-accent-blue">{formatar(receitasTotal)}</div>
              <div className="text-xs text-white/30 mt-1">Salário Real + Extras + VA + Refeição</div>
            </div>
            <div className="metric-card">
              <div className="metric-label text-white/40 mb-1">Total Investido</div>
              <div className="metric-value !text-2xl text-white">{formatar(totalInvestido)}</div>
            </div>
            <div className="metric-card metric-card-despesa">
              <div className="metric-label text-accent-pink/60 mb-1">Total Despesas (mês)</div>
              <div className="metric-value !text-2xl text-accent-pink">{formatar(despesasMes)}</div>
            </div>
            <div className={`metric-card ${patrimonioLiquido >= 0 ? 'metric-card-receita' : 'metric-card-despesa'}`}>
              <div className={`metric-label mb-1 ${patrimonioLiquido >= 0 ? 'text-accent-blue/60' : 'text-accent-pink/60'}`}>Patrimônio Líquido</div>
              <div className={`metric-value !text-2xl ${patrimonioLiquido >= 0 ? 'text-accent-blue' : 'text-accent-pink'}`}>
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
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/50">Gasto no mês</span>
              <span className="text-sm font-semibold text-white">{formatar(despesasMes)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/50">Salário + benefícios</span>
              <span className="text-sm font-semibold text-white">{formatar(receitasTotal)}</span>
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
