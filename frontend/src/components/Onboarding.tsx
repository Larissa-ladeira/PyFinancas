import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, TrendingDown, Target, Check, ArrowRight, PiggyBank } from 'lucide-react'

interface Props {
  onComplete: () => void
}

const steps = [
  {
    title: 'Bem-vindo ao PyFinanças!',
    subtitle: 'Vamos configurar sua vida financeira em poucos passos',
    icon: PiggyBank,
  },
  {
    title: 'Qual seu salário?',
    subtitle: 'Seu salário base mensal para calcular orçamentos',
    icon: DollarSign,
    field: 'salario' as const,
  },
  {
    title: 'Você tem dívidas?',
    subtitle: 'Adicione suas dívidas para começar a jornada da desfudência',
    icon: TrendingDown,
    field: 'divida' as const,
  },
  {
    title: 'Qual sua primeira meta?',
    subtitle: 'Definir metas ajuda a manter o foco financeiro',
    icon: Target,
    field: 'meta' as const,
  },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [salario, setSalario] = useState('')
  const [dividaDesc, setDividaDesc] = useState('')
  const [dividaValor, setDividaValor] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [metaValor, setMetaValor] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (step === 1 && salario) {
        const { data: existing } = await supabase.from('configuracoes').select('id').eq('usuario_id', user.id).single()
        if (existing) {
          await supabase.from('configuracoes').update({ salario_base: Number(salario) }).eq('id', existing.id)
        } else {
          await supabase.from('configuracoes').insert({ usuario_id: user.id, salario_base: Number(salario) })
        }
      }

      if (step === 2 && dividaDesc && dividaValor) {
        const minimo = Math.round(Number(dividaValor) * 0.03 * 100) / 100
        await supabase.from('dividas').insert({
          usuario_id: user.id,
          descricao: dividaDesc,
          valor_total: Number(dividaValor),
          valor_original: Number(dividaValor),
          valor_pago: 0,
          taxa_juros: 0,
          pagamento_minimo: Math.max(minimo, 10),
          quitada: false,
        })
      }

      if (step === 3 && metaDesc && metaValor) {
        await supabase.from('metas_economia').insert({
          usuario_id: user.id,
          descricao: metaDesc,
          valor_alvo: Number(metaValor),
          valor_atual: 0,
          concluida: false,
        })
      }
    } finally {
      setSaving(false)
    }

    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      onComplete()
    }
  }

  function skip() {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      onComplete()
    }
  }

  const s = steps[step]

  return (
    <div className="min-h-screen bg-[#06032D] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-pink/20 border border-accent-purple/30 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-accent-pink" />
          </div>
          <span className="text-xl font-bold text-white">PyFinanças</span>
        </div>

        <div className="glass-card p-8">
          <div className="flex justify-center mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full mx-1.5 transition-all ${
                i === step ? 'bg-accent-blue w-6' : i < step ? 'bg-accent-purple' : 'bg-white/20'
              }`} />
            ))}
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <s.icon className="w-8 h-8 text-accent-blue" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{s.title}</h2>
            <p className="text-sm text-white/50">{s.subtitle}</p>
          </div>

          {step === 1 && (
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Salário mensal (R$)</label>
              <input type="number" step="0.01" min="0" placeholder="3000,00"
                value={salario} onChange={e => setSalario(e.target.value)}
                className="input-glass text-lg text-center" autoFocus />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Descrição da dívida</label>
                <input type="text" placeholder="Ex: Cartão de crédito" autoFocus
                  value={dividaDesc} onChange={e => setDividaDesc(e.target.value)}
                  className="input-glass" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Valor total (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="5000,00"
                  value={dividaValor} onChange={e => setDividaValor(e.target.value)}
                  className="input-glass" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Descrição da meta</label>
                <input type="text" placeholder="Ex: Reserva de emergência" autoFocus
                  value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                  className="input-glass" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Valor alvo (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="10000,00"
                  value={metaValor} onChange={e => setMetaValor(e.target.value)}
                  className="input-glass" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={skip} className="btn-outline flex-1">
              Pular
            </button>
            <button onClick={handleNext} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvando...' : step === steps.length - 1 ? (
                <span className="flex items-center gap-2">Começar <Check className="w-4 h-4" /></span>
              ) : (
                <span className="flex items-center gap-2">Próximo <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
