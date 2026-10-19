import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatar } from '../lib/format'
import type { Transacao, Conta, Investimento } from '../types'
import { TIPOS_CONTA } from '../types'
import { Save, Building2, Plus, Trash2, Pencil, CalendarClock, Wallet, Banknote } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

function paraISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcularPascoa(ano: number) {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function feriadosNacionais(ano: number) {
  const feriados = new Set([
    `${ano}-01-01`,
    `${ano}-04-21`,
    `${ano}-05-01`,
    `${ano}-09-07`,
    `${ano}-10-12`,
    `${ano}-11-02`,
    `${ano}-11-15`,
    `${ano}-11-20`,
    `${ano}-12-25`,
  ])
  const sextaSanta = calcularPascoa(ano)
  sextaSanta.setDate(sextaSanta.getDate() - 2)
  feriados.add(paraISO(sextaSanta))
  return feriados
}

function quintoDiaUtil(ano: number, mes: number) {
  const feriados = feriadosNacionais(ano)
  let dia = 1
  let uteis = 0
  while (true) {
    const data = new Date(ano, mes - 1, dia)
    const diaSemana = data.getDay()
    if (diaSemana !== 0 && diaSemana !== 6 && !feriados.has(paraISO(data))) {
      uteis++
      if (uteis === 5) return data
    }
    dia++
  }
}

export default function Receitas() {
  const [salario, setSalario] = useState('')
  const [salarioReal, setSalarioReal] = useState('')
  const [pagoPorQuinzena, setPagoPorQuinzena] = useState(false)
  const [valor5, setValor5] = useState('')
  const [valor20, setValor20] = useState('')
  const [temValeAlimentacao, setTemValeAlimentacao] = useState(true)
  const [valeAlimentacao, setValeAlimentacao] = useState('')
  const [temRefeicao, setTemRefeicao] = useState(true)
  const [refeicao, setRefeicao] = useState('')
  const [configId, setConfigId] = useState<number | null>(null)
  const [todas, setTodas] = useState<Transacao[]>([])
  const [saved, setSaved] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

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
      if (data.user) setUsuarioId(data.user.id)
    })
    supabase.from('configuracoes').select('*').single().then(({ data }) => {
      if (data) {
        setSalario(String(data.salario_base ?? ''))
        setSalarioReal(String(data.salario_real ?? ''))
        setPagoPorQuinzena(data.pago_por_quinzena ?? false)
        setValor5(String(data.valor_quinzena_5_dia_util ?? ''))
        setValor20(String(data.valor_quinzena_dia_20 ?? ''))
        setTemValeAlimentacao(data.tem_vale_alimentacao ?? true)
        setValeAlimentacao(String(data.vale_alimentacao ?? ''))
        setTemRefeicao(data.tem_refeicao ?? true)
        setRefeicao(String(data.refeicao ?? ''))
        setConfigId(data.id)
      }
    })
    supabase.from('transacoes').select('*').then(({ data }) => setTodas(data || []))
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
    const payload = {
      salario_base: parseFloat(salario) || 0,
      salario_real: parseFloat(salarioReal) || 0,
      pago_por_quinzena: pagoPorQuinzena,
      valor_quinzena_5_dia_util: pagoPorQuinzena ? (parseFloat(valor5) || 0) : 0,
      valor_quinzena_dia_20: pagoPorQuinzena ? (parseFloat(valor20) || 0) : 0,
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

  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()
  const totalRec = todas.filter(t =>
    t.tipo.toLowerCase() === 'receita' &&
    new Date(t.data_transacao).getMonth() + 1 === mesAtual &&
    new Date(t.data_transacao).getFullYear() === anoAtual
  ).reduce((s, t) => s + Number(t.valor), 0)
  const despesasMes = todas.filter(t =>
    t.tipo.toLowerCase() === 'despesa' &&
    new Date(t.data_transacao).getMonth() + 1 === mesAtual &&
    new Date(t.data_transacao).getFullYear() === anoAtual
  ).reduce((s, t) => s + Number(t.valor), 0)
  const salarioBaseNum = parseFloat(salario) || 0
  const salarioRealNum = parseFloat(salarioReal) || 0
  const valor5Num = parseFloat(valor5) || 0
  const valor20Num = parseFloat(valor20) || 0
  const somaQuinzena = valor5Num + valor20Num
  const salarioComponente = pagoPorQuinzena && somaQuinzena > 0 ? somaQuinzena : salarioRealNum
  const va = temValeAlimentacao ? (parseFloat(valeAlimentacao) || 0) : 0
  const ref = temRefeicao ? (parseFloat(refeicao) || 0) : 0
  const receitasTotal = salarioComponente + totalRec + va + ref
  const totalInvestido = investimentos.reduce((s, i) => s + Number(i.valor_investido), 0)
  const totalAtual = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0)
  const saldoBancario = contas.reduce((s, c) => s + Number(c.saldo), 0)
  const patrimonioLiquido = totalAtual + saldoBancario
  const percGasto = receitasTotal > 0 ? (despesasMes / receitasTotal) * 100 : 0

  const dataPrimeiraQuinzena = quintoDiaUtil(anoAtual, mesAtual)
  const dataSegundaQuinzena = new Date(anoAtual, mesAtual - 1, 20)
  const totalQuinzena = somaQuinzena > 0 ? somaQuinzena : (salarioRealNum > 0 ? salarioRealNum : salarioBaseNum)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Receitas</h1>

      <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Banknote className="w-5 h-5" /> Rendimentos
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
              <input type="checkbox" checked={pagoPorQuinzena}
                onChange={e => setPagoPorQuinzena(e.target.checked)}
                className="w-4 h-4 accent-accent-blue" />
              <span className="text-sm font-medium text-white/60">Recebo por quinzena (2x no mês)</span>
            </label>
            <p className="text-xs text-white/30">
              {pagoPorQuinzena ? 'Salário no 5º dia útil e adiantamento no dia 20.' : 'Salário pago em uma única vez no mês.'}
            </p>
          </div>
          {pagoPorQuinzena ? (
            <>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Salário (5º dia útil)</label>
                <input type="number" step="0.01" min="0" placeholder="Ex: 2000,00"
                  className="input-glass" value={valor5} onChange={e => setValor5(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Adiantamento (dia 20)</label>
                <input type="number" step="0.01" min="0" placeholder="Ex: 1000,00"
                  className="input-glass" value={valor20} onChange={e => setValor20(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="hidden sm:block" />
          )}
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

      {pagoPorQuinzena && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <CalendarClock className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Cronograma de Pagamentos (Quinzena)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Salário — 5º dia útil</p>
              <p className="text-lg font-bold text-accent-blue">{formatar(valor5Num)}</p>
              <p className="text-xs text-white/30 mt-1">{dataPrimeiraQuinzena.toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Adiantamento — dia 20</p>
              <p className="text-lg font-bold text-accent-blue">{formatar(valor20Num)}</p>
              <p className="text-xs text-white/30 mt-1">{dataSegundaQuinzena.toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-white/5">
            <span className="text-white/50">Total por mês</span>
            <span className="font-semibold text-white">{formatar(totalQuinzena)}</span>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card metric-card-receita">
          <div className="metric-label text-accent-blue/60 mb-1">Total Receitas (mês)</div>
          <div className="metric-value !text-2xl text-accent-blue">{formatar(receitasTotal)}</div>
          <div className="text-xs text-white/30 mt-1">Salário + Extras (mês) + VA + Refeição</div>
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
          <div className={`metric-label mb-1 ${patrimonioLiquido >= 0 ? 'text-accent-blue/60' : 'text-accent-pink/60'}`}>
            Patrimônio Líquido
          </div>
          <div className={`metric-value !text-2xl ${patrimonioLiquido >= 0 ? 'text-accent-blue' : 'text-accent-pink'}`}>
            {formatar(patrimonioLiquido)}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-white/70 mb-3">
          <Wallet className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Gastos vs Salário</h3>
        </div>
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
    </div>
  )
}
