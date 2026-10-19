import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, User, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Configuracoes() {
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

  const [mfaStatus, setMfaStatus] = useState<'loading' | 'off' | 'on' | 'enrolling'>('loading')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaEnrollId, setMfaEnrollId] = useState<string | null>(null)
  const [mfaQr, setMfaQr] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMsg, setMfaMsg] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaCopied, setMfaCopied] = useState(false)
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
    supabase.from('notificacoes').select('*').single().then(({ data }) => {
      if (data) {
        setNotifAtivo(data.ativo)
        setNotifEmail(data.email_notificacao || '')
        setNotifDias(data.dias_antes)
        setNotifId(data.id)
      }
    })
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
    const { data: factorsData } = await supabase.auth.mfa.listFactors()
    const stale = factorsData?.all?.filter(f => f.factor_type === 'totp' && f.status === 'unverified') ?? []
    for (const f of stale) {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
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

  function handleMfaCopySecret() {
    if (!mfaSecret) return
    try {
      navigator.clipboard.writeText(mfaSecret)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = mfaSecret
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setMfaCopied(true)
    setTimeout(() => setMfaCopied(false), 2000)
  }

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
                <span>Instale o <a href="https://play.google.com/store/apps/details?id=com.totp.twofa.authenticator.authenticate"
                  target="_blank" rel="noopener noreferrer"
                  className="text-accent-blue underline decoration-accent-blue/40 hover:text-accent-blue/80 font-semibold">
                  Authenticator App: Secure 2FA</a> (grátis) no seu celular.</span>
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
                <span>No celular, abra o <a href="https://play.google.com/store/apps/details?id=com.totp.twofa.authenticator.authenticate"
                  target="_blank" rel="noopener noreferrer"
                  className="text-accent-blue underline decoration-accent-blue/40 hover:text-accent-blue/80 font-semibold">
                  app autenticador</a> e toque em <strong className="text-white/70">+ → Escanear código QR</strong>.</span>
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
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-white/40">
                  Chave: <span className="font-mono text-white/70 break-all">{mfaSecret}</span>
                </p>
                <button type="button" onClick={handleMfaCopySecret}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-accent-blue transition-colors shrink-0"
                  title="Copiar chave">
                  {mfaCopied ? <Check className="w-3.5 h-3.5 text-accent-blue" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
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
    </div>
  )
}
