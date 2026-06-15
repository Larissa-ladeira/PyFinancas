import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { CATEGORIAS_DESPESA, MESES_PT } from '../types'
import {
  TrendingDown, Wallet, Trash2, PieChart, Pencil, X, Save, Plus, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react'

const COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#10b981']

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

  useEffect(() => {
    supabase.from('configuracoes').select('*').single()
      .then(({ data }) => { if (data) setSalario(Number(data.salario_base)) })
  }, [])

  useEffect(() => { carregar() }, [mes, ano])

  async function carregar() {
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
      setFormSuccess(true)
      setFormDescricao('')
      setFormValor('')
      setFormData(new Date().toISOString().split('T')[0])
      setFormCategoria(CATEGORIAS_DESPESA[0])
      carregar()
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
      setEditandoId(null)
      carregar()
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
            {formErrorMsg && (
              <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formErrorMsg}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm rounded-xl p-3">
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
        <div className="flex items-center gap-2 text-rose-300 mb-1.5">
          <TrendingDown className="w-4 h-4" />
          <span className="metric-label">Total de Despesas</span>
        </div>
        <p className="metric-value text-despesa">{formatar(totalDespesas)}</p>
      </div>

      {catOrdenadas.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <PieChart className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Despesas por Categoria</h2>
          </div>
          <div className="space-y-3">
            {catOrdenadas.map(([cat, valor], i) => {
              const pct = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-white/70">{cat}</span>
                    </div>
                    <span className="text-white font-medium">{formatar(valor)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
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
          <div className="overflow-x-auto scrollbar-hide">
            <table className="table-glass">
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th className="text-center w-16">Pagar</th><th className="text-right w-20">Ações</th></tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  editandoId === t.id ? (
                    <tr key={t.id}>
                      <td colSpan={6} className="p-3">
                        <form onSubmit={handleEditSave} className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs text-white/40 mb-1">Descrição</label>
                            <input type="text" required className="input-glass" value={editDescricao}
                              onChange={e => setEditDescricao(e.target.value)} />
                          </div>
                          <div className="w-28">
                            <label className="block text-xs text-white/40 mb-1">Valor</label>
                            <input type="number" required min="0.01" step="0.01" className="input-glass" value={editValor}
                              onChange={e => setEditValor(e.target.value)} />
                          </div>
                          <div className="w-36">
                            <label className="block text-xs text-white/40 mb-1">Categoria</label>
                            <select className="select-glass" value={editCategoria}
                              onChange={e => setEditCategoria(e.target.value)}>
                              {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="w-36">
                            <label className="block text-xs text-white/40 mb-1">Data</label>
                            <input type="date" required className="input-glass" value={editData}
                              onChange={e => setEditData(e.target.value)} />
                          </div>
                          <div className="flex gap-1 pb-0.5">
                            <button type="submit" disabled={loading}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition-all">
                              <Save className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={cancelarEdicao}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {errorMsg && (
                            <p className="text-xs text-rose-300 w-full">{errorMsg}</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr key={t.id}>
                        <td className="text-white/40 whitespace-nowrap">{t.data_transacao}</td>
                        <td className="text-white/80 font-medium">{t.descricao}</td>
                        <td><span className="badge badge-despesa">{t.categoria}</span></td>
                        <td className="text-right font-semibold text-rose-300 whitespace-nowrap">
                          -{formatar(Number(t.valor))}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <button onClick={() => { setPagandoId(pagandoId === t.id ? null : t.id); setValorPagar(''); setTipoPagamento('total'); setPagarError('') }}
                            className={`p-1.5 rounded-lg transition-all align-middle ${
                              pagandoId === t.id
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'hover:bg-emerald-500/20 text-white/30 hover:text-emerald-300'
                            }`}>
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button onClick={() => iniciarEdicao(t)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-white/30 hover:text-emerald-300 transition-all align-middle">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-300 transition-all align-middle ml-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {pagandoId === t.id && (
                        <tr key={`pag-${t.id}`}>
                          <td colSpan={6} className="p-3 bg-white/5">
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setTipoPagamento('total'); setValorPagar(''); setPagarError('') }}
                                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                                    tipoPagamento === 'total'
                                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
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
                                  <span className="text-lg font-bold text-emerald-300">
                                    {formatar(Number(t.valor))}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <label className="block text-xs text-white/40 mb-1">Valor do pagamento</label>
                                    <input type="number" min="0.01" step="0.01" required placeholder="0,00"
                                      className="input-glass" value={valorPagar}
                                      onChange={e => setValorPagar(e.target.value)} autoFocus />
                                  </div>
                                </div>
                              )}
                              {pagarError && (
                                <p className="text-xs text-rose-300">{pagarError}</p>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => handlePagarDespesa(t)}
                                  className="btn-primary flex-1">
                                  {tipoPagamento === 'total' ? `Quitar — ${formatar(Number(t.valor))}` : 'Confirmar Pagamento'}
                                </button>
                                <button onClick={() => { setPagandoId(null); setPagarError('') }}
                                  className="btn-outline">Cancelar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/30 text-sm py-4 text-center">Nenhuma despesa neste mês</p>
        )}
      </div>

      <div className="metric-card">
        <div className="flex items-center gap-2 text-white/70 mb-3">
          <Wallet className="w-4 h-4" />
          <span className="metric-label">Salário vs Gastos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-white/40">Salário</span>
            <p className="text-lg font-bold text-emerald-300">{formatar(salario)}</p>
          </div>
          <div>
            <span className="text-xs text-white/40">% Comprometido</span>
            <p className={`text-lg font-bold ${percGasto > 70 ? 'text-rose-300' : 'text-white'}`}>
              {percGasto.toFixed(1)}%
            </p>
          </div>
          <div>
            <span className="text-xs text-white/40">Saldo livre</span>
            <p className={`text-lg font-bold ${saldoLivre >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
              {formatar(saldoLivre)}
            </p>
          </div>
        </div>
        {salario > 0 && (
          <div className="mt-3 w-full bg-white/5 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${percGasto > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(percGasto, 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
