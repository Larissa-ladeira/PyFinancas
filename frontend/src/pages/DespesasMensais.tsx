import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao, MetaOrcamento, Lembrete, TransacaoRecorrente } from '../types'
import { CATEGORIAS_DESPESA, MESES_PT } from '../types'
import {
  TrendingDown, Wallet, Trash2, PieChart, Pencil, Save, Plus, CheckCircle, AlertCircle, DollarSign, Bell, Repeat, Pause
} from 'lucide-react'
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const COLORS = ['#FF2E9A', '#f59e0b', '#00D4FF', '#A855F7', '#ffffff', '#A855F7', '#FF2E9A', '#A855F7', '#00D4FF', '#FF2E9A', '#00D4FF']

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DespesasMensais() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [salario, setSalario] = useState(0)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editDescricao, setEditDescricao] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [editData, setEditData] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formValor, setFormValor] = useState('')
  const [formCategoria, setFormCategoria] = useState(CATEGORIAS_DESPESA[0])
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0])
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formErrorMsg, setFormErrorMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [pagandoId, setPagandoId] = useState<number | null>(null)
  const [tipoPagamento, setTipoPagamento] = useState<'total' | 'parcial'>('total')
  const [valorPagar, setValorPagar] = useState('')
  const [pagarError, setPagarError] = useState('')
  const [metasOrcamento, setMetasOrcamento] = useState<MetaOrcamento[]>([])
  const [editandoBudget, setEditandoBudget] = useState<string | null>(null)
  const [budgetValor, setBudgetValor] = useState('')
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [formRecorrente, setFormRecorrente] = useState(false)
  const [recorrentesAtivos, setRecorrentesAtivos] = useState<TransacaoRecorrente[]>([])
  const [editandoRecId, setEditandoRecId] = useState<number | null>(null)
  const [editRecDescricao, setEditRecDescricao] = useState('')
  const [editRecValor, setEditRecValor] = useState('')
  const [editRecCategoria, setEditRecCategoria] = useState('')
  const [editRecDia, setEditRecDia] = useState('')
  const [editRecorrente, setEditRecorrente] = useState(false)

  useEffect(() => {
    supabase.from('configuracoes').select('*').single()
      .then(({ data }) => { if (data) setSalario(Number(data.salario_base)) })
  }, [])

  useEffect(() => { carregar(); carregarOrcamento(); carregarLembretes(); carregarRecorrentes() }, [mes, ano])

  async function carregarOrcamento() {
    const { data } = await supabase.from('metas_orcamento').select('*')
      .eq('mes', mes).eq('ano', ano)
    setMetasOrcamento(data || [])
  }

  async function salvarOrcamento(categoria: string, valor: number) {
    const existente = metasOrcamento.find(m => m.categoria === categoria)
    if (existente) {
      await supabase.from('metas_orcamento').update({ valor_limite: valor }).eq('id', existente.id)
    } else {
      await supabase.from('metas_orcamento').insert({
        categoria, valor_limite: valor, mes, ano,
      })
    }
    carregarOrcamento()
  }

  async function carregarLembretes() {
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('lembretes').select('*')
      .gte('data_vencimento', inicio).lt('data_vencimento', fim)
      .order('data_vencimento', { ascending: false })
    setLembretes(data || [])
  }

  async function autoGerarRecorrentes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: recorrentes } = await supabase.from('transacoes_recorrentes')
      .select('*').eq('ativa', true)
    if (!recorrentes?.length) return

    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]

    const { data: existentes } = await supabase.from('transacoes').select('descricao, valor')
      .eq('usuario_id', user.id).eq('tipo', 'despesa')
      .gte('data_transacao', inicio).lt('data_transacao', fim)

    for (const r of recorrentes) {
      if (r.tipo !== 'despesa') continue
      const jaExiste = existentes?.some(e =>
        e.descricao === r.descricao && Math.abs(Number(e.valor) - Number(r.valor)) < 0.01
      )
      if (jaExiste) continue
      const diaValido = Math.min(r.dia_vencimento, new Date(ano, mes, 0).getDate())
      const dataTransacao = new Date(ano, mes - 1, diaValido).toISOString().split('T')[0]
      await supabase.from('transacoes').insert({
        usuario_id: user.id, descricao: r.descricao, valor: r.valor,
        tipo: 'despesa', categoria: r.categoria, data_transacao: dataTransacao,
      })
    }
  }

  async function carregarRecorrentes() {
    const { data } = await supabase.from('transacoes_recorrentes').select('*')
      .eq('ativa', true).order('created_at', { ascending: false })
    setRecorrentesAtivos(data || [])
  }

  async function toggleRecorrente(id: number, ativa: boolean) {
    await supabase.from('transacoes_recorrentes').update({ ativa: !ativa }).eq('id', id)
    carregarRecorrentes()
  }

  async function deleteRecorrente(id: number) {
    await supabase.from('transacoes_recorrentes').delete().eq('id', id)
    carregarRecorrentes()
  }

  function iniciarEdicaoRecorrente(r: TransacaoRecorrente) {
    setEditandoRecId(r.id)
    setEditRecDescricao(r.descricao)
    setEditRecValor(String(r.valor))
    setEditRecCategoria(r.categoria)
    setEditRecDia(String(r.dia_vencimento))
  }

  function cancelarEdicaoRecorrente() {
    setEditandoRecId(null)
  }

  async function handleEditRecSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoRecId) return
    await supabase.from('transacoes_recorrentes').update({
      descricao: editRecDescricao,
      valor: parseFloat(editRecValor),
      categoria: editRecCategoria,
      dia_vencimento: parseInt(editRecDia),
    }).eq('id', editandoRecId)
    setEditandoRecId(null)
    carregarRecorrentes()
  }

  async function carregar() {
    await autoGerarRecorrentes()
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('transacoes').select('*')
      .eq('tipo', 'despesa')
      .gte('data_transacao', inicio).lt('data_transacao', fim)
      .order('data_transacao', { ascending: false })
    setTransacoes(data || [])
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErrorMsg('')
    setFormLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('transacoes').insert({
      usuario_id: user?.id,
      descricao: formDescricao,
      valor: parseFloat(formValor),
      tipo: 'despesa',
      categoria: formCategoria,
      data_transacao: formData,
    })
    if (error) {
      setFormErrorMsg(error.message)
    } else {
      await supabase.from('lembretes').insert({
        usuario_id: user?.id,
        descricao: formDescricao,
        valor: parseFloat(formValor),
        data_vencimento: formData,
        pago: false,
      })
      if (formRecorrente) {
        const dia = new Date(formData).getDate()
        await supabase.from('transacoes_recorrentes').insert({
          usuario_id: user?.id,
          descricao: formDescricao,
          valor: parseFloat(formValor),
          tipo: 'despesa',
          categoria: formCategoria,
          dia_vencimento: dia,
          ativa: true,
        })
      }
      setFormSuccess(true)
      setFormDescricao('')
      setFormValor('')
      setFormData(new Date().toISOString().split('T')[0])
      setFormCategoria(CATEGORIAS_DESPESA[0])
      setFormRecorrente(false)
      carregar()
      carregarLembretes()
      carregarRecorrentes()
      setTimeout(() => setFormSuccess(false), 2000)
    }
    setFormLoading(false)
  }

  const totalDespesas = transacoes.reduce((s, t) => s + Number(t.valor), 0)
  const percGasto = salario > 0 ? (totalDespesas / salario) * 100 : 0
  const saldoLivre = salario - totalDespesas

  const despCat = transacoes.reduce<Record<string, number>>((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
    return acc
  }, {})
  const catOrdenadas = Object.entries(despCat).sort((a, b) => b[1] - a[1])

  function iniciarEdicao(t: Transacao) {
    setEditandoId(t.id)
    setEditDescricao(t.descricao)
    setEditValor(String(t.valor))
    setEditCategoria(t.categoria)
    setEditData(t.data_transacao)
    setEditRecDia(new Date(t.data_transacao).getDate().toString())
    const match = recorrentesAtivos.find(r =>
      r.descricao === t.descricao && Math.abs(Number(r.valor) - Number(t.valor)) < 0.01
    )
    setEditRecorrente(!!match)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setErrorMsg('')
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId) return
    setLoading(true)
    const { error } = await supabase.from('transacoes').update({
      descricao: editDescricao,
      valor: parseFloat(editValor),
      categoria: editCategoria,
      data_transacao: editData,
    }).eq('id', editandoId)
    if (error) {
      setErrorMsg(error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (editRecorrente) {
        const existing = await supabase.from('transacoes_recorrentes').select('id')
          .eq('descricao', editDescricao)
          .gte('valor', parseFloat(editValor) - 0.01)
          .lte('valor', parseFloat(editValor) + 0.01)
          .maybeSingle()
        if (!existing.data) {
          await supabase.from('transacoes_recorrentes').upsert({
            usuario_id: user?.id,
            descricao: editDescricao,
            valor: parseFloat(editValor),
            tipo: 'despesa',
            categoria: editCategoria,
            dia_vencimento: parseInt(editRecDia) || new Date(editData).getDate(),
            ativa: true,
          }, { onConflict: 'usuario_id, descricao, valor' })
        }
      } else {
        await supabase.from('transacoes_recorrentes').delete()
          .eq('descricao', editDescricao)
          .gte('valor', parseFloat(editValor) - 0.01)
          .lte('valor', parseFloat(editValor) + 0.01)
      }
      setEditandoId(null)
      carregar()
      carregarRecorrentes()
    }
    setLoading(false)
  }

  async function handleDelete(id: number) {
    await supabase.from('transacoes').delete().eq('id', id)
    carregar()
  }

  async function handlePagarDespesa(t: Transacao) {
    setPagarError('')
    if (tipoPagamento === 'total') {
      await supabase.from('transacoes').delete().eq('id', t.id)
    } else {
      const pago = parseFloat(valorPagar) || 0
      if (pago <= 0 || pago > Number(t.valor)) {
        setPagarError('Valor inválido')
        return
      }
      const restante = Number(t.valor) - pago
      await supabase.from('transacoes').update({ valor: pago }).eq('id', t.id)
      if (restante > 0.01) {
        const { data: { user } } = await supabase.auth.getUser()
        const proxMes = mes === 12 ? 1 : mes + 1
        const proxAno = mes === 12 ? ano + 1 : ano
        await supabase.from('transacoes').insert({
          usuario_id: user?.id,
          descricao: `${t.descricao} (saldo)`,
          valor: restante,
          tipo: 'despesa',
          categoria: t.categoria,
          data_transacao: new Date(proxAno, proxMes - 1, 1).toISOString().split('T')[0],
        })
      }
    }
    setPagandoId(null)
    setValorPagar('')
    carregar()
  }

  async function toggleLembrete(id: number, pago: boolean) {
    await supabase.from('lembretes').update({ pago: !pago }).eq('id', id)
    carregarLembretes()
  }

  async function deleteLembrete(id: number) {
    await supabase.from('lembretes').delete().eq('id', id)
    carregarLembretes()
  }

  const lembretesPendentes = lembretes.filter(l => !l.pago)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Despesas do Mês</h1>
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="select-glass w-auto">
            {MESES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="select-glass w-auto">
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card p-5">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-2 text-white/70">
            <Plus className="w-4 h-4" />
            <span className="font-semibold text-sm">Nova Despesa</span>
          </div>
          <span className={`text-xs text-white/30 transition-transform ${showForm ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showForm && (
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Categoria</label>
              <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)} className="select-glass">
                {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Descrição</label>
              <input type="text" required placeholder="Ex: Almoço, Mercado, etc."
                className="input-glass" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Valor (R$)</label>
                <input type="number" required min="0.01" step="0.01" placeholder="0,00"
                  className="input-glass" value={formValor} onChange={e => setFormValor(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Data</label>
                <input type="date" required className="input-glass"
                  value={formData} onChange={e => setFormData(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formRecorrente}
                onChange={e => setFormRecorrente(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-accent-blue" />
              <span className="text-sm text-white/60">Repetir todo mês</span>
            </label>
            {formErrorMsg && (
              <div className="flex items-center gap-2 bg-accent-pink/15 border border-accent-pink/25 text-accent-pink text-sm rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formErrorMsg}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm rounded-xl p-3">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Despesa salva com sucesso!
              </div>
            )}
            <button type="submit" disabled={formLoading || formSuccess}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {formLoading ? 'Salvando...' : formSuccess ? 'Salvo!' : 'Salvar Despesa'}
            </button>
          </form>
        )}
      </div>

      <div className="metric-card metric-card-despesa">
        <div className="flex items-center gap-2 text-accent-pink mb-1.5">
          <TrendingDown className="w-4 h-4" />
          <span className="metric-label">Total de Despesas</span>
        </div>
        <p className="metric-value text-accent-pink">{formatar(totalDespesas)}</p>
      </div>

      {catOrdenadas.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <PieChart className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Despesas por Categoria</h2>
          </div>
          <div className="space-y-3">
            {catOrdenadas.map(([cat, valor], i) => {
              const meta = metasOrcamento.find(m => m.categoria === cat)
              const limite = meta?.valor_limite || 0
              const budgetPct = limite > 0 ? (valor / limite) * 100 : 0
              const estourou = limite > 0 && valor > limite
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${estourou ? 'bg-accent-pink animate-pulse' : ''}`}
                        style={{ backgroundColor: estourou ? undefined : COLORS[i % COLORS.length] }} />
                      <span className="text-white/70">{cat}</span>
                      {estourou && <span className="text-[10px] text-accent-pink font-medium">● Acima do orçamento</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {limite > 0 && (
                        <span className="text-xs text-white/30">
                          {formatar(valor)} / {formatar(limite)}
                        </span>
                      )}
                      {limite === 0 && <span className="text-white font-medium">{formatar(valor)}</span>}
                      {editandoBudget === cat ? (
                        <form onSubmit={(e) => { e.preventDefault(); salvarOrcamento(cat, parseFloat(budgetValor)); setEditandoBudget(null) }}
                          className="flex items-center gap-1">
                          <input type="number" min="0" step="0.01" className="input-glass !py-1 !px-2 !text-xs w-24"
                            value={budgetValor} onChange={e => setBudgetValor(e.target.value)} autoFocus />
                          <button type="submit" className="text-xs text-accent-blue hover:text-accent-blue/80">ok</button>
                          <button type="button" className="text-xs text-white/30 hover:text-white/60"
                            onClick={() => setEditandoBudget(null)}>x</button>
                        </form>
                      ) : (
                        <button onClick={() => { setEditandoBudget(cat); setBudgetValor(String(limite || '')) }}
                          className="text-xs text-white/20 hover:text-accent-blue transition-all">
                          {limite > 0 ? 'Editar' : 'Definir orçamento'}
                        </button>
                      )}
                    </div>
                  </div>
                  {(limite > 0 || estourou) && (
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${estourou ? 'bg-accent-pink' : ''}`}
                        style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: estourou ? undefined : COLORS[i % COLORS.length] }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-4">
          Transações ({transacoes.length})
        </h2>
        {transacoes.length > 0 ? (
          <div className="space-y-3">
            {transacoes.map(t => (
              editandoId === t.id ? (
                <div key={t.id} className="glass-card p-4">
                  <form onSubmit={handleEditSave} className="space-y-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Descrição</label>
                      <input type="text" required className="input-glass" value={editDescricao}
                        onChange={e => setEditDescricao(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Valor</label>
                        <input type="number" required min="0.01" step="0.01" className="input-glass" value={editValor}
                          onChange={e => setEditValor(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Data</label>
                        <input type="date" required className="input-glass" value={editData}
                          onChange={e => setEditData(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Categoria</label>
                      <select className="select-glass" value={editCategoria}
                        onChange={e => setEditCategoria(e.target.value)}>
                        {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editRecorrente}
                        onChange={e => setEditRecorrente(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 accent-accent-blue" />
                      <span className="text-xs text-white/60">Repetir todo mês</span>
                    </label>
                    {errorMsg && (
                      <p className="text-xs text-accent-pink">{errorMsg}</p>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" disabled={loading}
                        className="btn-primary flex-1">
                        <Save className="w-4 h-4" />
                        Salvar
                      </button>
                      <button type="button" onClick={cancelarEdicao}
                        className="btn-outline flex-1">Cancelar</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div key={t.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{t.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40">{t.data_transacao}</span>
                        <span className="badge badge-despesa">{t.categoria}</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-accent-pink shrink-0 -mt-0.5">
                      -{formatar(Number(t.valor))}
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                    <button onClick={() => { setPagandoId(pagandoId === t.id ? null : t.id); setValorPagar(''); setTipoPagamento('total'); setPagarError('') }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        pagandoId === t.id
                          ? 'bg-accent-blue/20 text-accent-blue'
                          : 'bg-white/5 text-white/50 hover:bg-accent-blue/20 hover:text-accent-blue'
                      }`}>
                      <DollarSign className="w-3.5 h-3.5" />
                      Pagar
                    </button>
                    <button onClick={() => iniciarEdicao(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-blue/20 hover:text-accent-blue transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-pink/20 hover:text-accent-pink transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                  {pagandoId === t.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setTipoPagamento('total'); setValorPagar(''); setPagarError('') }}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                            tipoPagamento === 'total'
                              ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue'
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                          }`}>
                          Pagar Total
                        </button>
                        <button type="button" onClick={() => setTipoPagamento('parcial')}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                            tipoPagamento === 'parcial'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                          }`}>
                          Pagar Parcial
                        </button>
                      </div>
                      {tipoPagamento === 'total' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Valor a quitar:</span>
                          <span className="text-lg font-bold text-accent-blue">
                            {formatar(Number(t.valor))}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Valor do pagamento</label>
                          <input type="number" min="0.01" step="0.01" required placeholder="0,00"
                            className="input-glass" value={valorPagar}
                            onChange={e => setValorPagar(e.target.value)} autoFocus />
                        </div>
                      )}
                      {pagarError && (
                        <p className="text-xs text-accent-pink">{pagarError}</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handlePagarDespesa(t)}
                          className="btn-primary flex-1">
                          {tipoPagamento === 'total' ? `Quitar — ${formatar(Number(t.valor))}` : 'Confirmar Pagamento'}
                        </button>
                        <button onClick={() => { setPagandoId(null); setPagarError('') }}
                          className="btn-outline flex-1">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm py-4 text-center">Nenhuma despesa neste mês</p>
        )}
      </div>

      {lembretesPendentes.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <Bell className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Lembretes pendentes ({lembretesPendentes.length})</h2>
          </div>
          <div className="space-y-2">
            {lembretesPendentes.map(l => (
              <div key={l.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{l.descricao}</p>
                  <p className="text-xs text-white/40">
                    vence {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-accent-pink">
                    {formatar(Number(l.valor))}
                  </span>
                  <button onClick={() => toggleLembrete(l.id, l.pago)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-accent-blue/20 hover:text-accent-blue transition-all"
                    title="Marcar como pago">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteLembrete(l.id)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-accent-pink/20 hover:text-accent-pink transition-all"
                    title="Excluir lembrete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(recorrentesAtivos.length > 0 || editandoRecId) && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <Repeat className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Repetições automáticas ({recorrentesAtivos.length})</h2>
          </div>
          <div className="space-y-2">
            {recorrentesAtivos.map(r => (
              editandoRecId === r.id ? (
                <form key={r.id} onSubmit={handleEditRecSave} className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input type="text" required placeholder="Descrição"
                      className="input-glass !py-1.5 !text-xs" value={editRecDescricao}
                      onChange={e => setEditRecDescricao(e.target.value)} />
                    <input type="number" required min="0.01" step="0.01" placeholder="Valor"
                      className="input-glass !py-1.5 !text-xs" value={editRecValor}
                      onChange={e => setEditRecValor(e.target.value)} />
                    <select className="select-glass !py-1.5 !text-xs" value={editRecCategoria}
                      onChange={e => setEditRecCategoria(e.target.value)}>
                      {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" min="1" max="31" required placeholder="Dia"
                      className="input-glass !py-1.5 !text-xs" value={editRecDia}
                      onChange={e => setEditRecDia(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary !py-1.5 !text-xs">Salvar</button>
                    <button type="button" onClick={cancelarEdicaoRecorrente}
                      className="btn-outline !py-1.5 !text-xs">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{r.descricao}</p>
                    <p className="text-xs text-white/40">
                      dia {r.dia_vencimento} • {r.categoria}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-sm font-bold text-accent-pink">
                      {formatar(Number(r.valor))}
                    </span>
                    <button onClick={() => iniciarEdicaoRecorrente(r)}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-accent-blue/20 hover:text-accent-blue transition-all"
                      title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleRecorrente(r.id, r.ativa)}
                      className="p-1.5 rounded-lg bg-white/5 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
                      title="Pausar repetição">
                      <Pause className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRecorrente(r.id)}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-accent-pink/20 hover:text-accent-pink transition-all"
                      title="Excluir repetição">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,46,154,0.18), rgba(168,85,247,0.18), rgba(0,212,255,0.18))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <Wallet className="w-4 h-4" />
          <span className="font-semibold text-sm">Progresso de Gastos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center">
            <div className="relative w-full max-w-[200px]">
              <ResponsiveContainer width="100%" height={190}>
                <RePieChart>
                  <Pie data={[
                    { name: 'Gasto', value: totalDespesas },
                    { name: 'Disponível', value: Math.max(saldoLivre, 0) },
                  ]} dataKey="value" innerRadius={55} outerRadius={80}
                    startAngle={90} endAngle={-270}>
                    <Cell fill="#FF2E9A" />
                    <Cell fill="rgba(255,255,255,0.08)" />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                <p className="text-2xl font-bold text-white">{percGasto.toFixed(0)}%</p>
                <p className="text-xs text-white/50">gasto</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/50">Gasto / Salário</span>
              <span className="text-sm font-semibold text-white">
                {formatar(totalDespesas)} / {formatar(salario)}
              </span>
            </div>
            {salario > 0 && (
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(percGasto, 100)}%`,
                    background: 'linear-gradient(90deg, #FF2E9A, #A855F7, #00D4FF)',
                  }} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-accent-blue">{formatar(salario)}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Salário</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${percGasto > 70 ? 'text-accent-pink' : 'text-white'}`}>
                  {percGasto.toFixed(1)}%
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Comprometido</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${saldoLivre >= 0 ? 'text-accent-purple' : 'text-accent-pink'}`}>
                  {formatar(saldoLivre)}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Saldo livre</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
