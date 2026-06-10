import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Divida } from '../types'
import {
  PiggyBank, Plus, Trash2, TrendingDown, CheckCircle,
  Brain, Calculator, Calendar
} from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type Estrategia = 'snowball' | 'avalanche'

export default function Dividas() {
  const [dividas, setDividas] = useState<Divida[]>([])
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [taxaJuros, setTaxaJuros] = useState('')
  const [pagamentoMinimo, setPagamentoMinimo] = useState('')
  const [dataVenc, setDataVenc] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pagandoId, setPagandoId] = useState<number | null>(null)
  const [valorPagamento, setValorPagamento] = useState('')
  const [estrategia, setEstrategia] = useState<Estrategia>('snowball')
  const [aporteExtra, setAporteExtra] = useState('')
  const [simulando, setSimulando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('dividas').select('*')
      .order('quitada', { ascending: true })
      .order('created_at', { ascending: false })
    setDividas(data || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('dividas').insert({
      descricao,
      valor_total: parseFloat(valorTotal),
      taxa_juros: parseFloat(taxaJuros) || 0,
      pagamento_minimo: parseFloat(pagamentoMinimo) || 0,
      data_vencimento: dataVenc || null,
    })
    if (!error) {
      setDescricao(''); setValorTotal(''); setTaxaJuros('')
      setPagamentoMinimo(''); setDataVenc('')
      setShowForm(false)
      carregar()
    }
    setLoading(false)
  }

  async function handlePagar(divida: Divida) {
    const valorPago = parseFloat(valorPagamento) || 0
    if (valorPago <= 0) return
    const novoPago = Number(divida.valor_pago) + valorPago
    const quitada = novoPago >= Number(divida.valor_total)
    await supabase.from('dividas').update({
      valor_pago: quitada ? divida.valor_total : novoPago,
      quitada,
    }).eq('id', divida.id)
    setPagandoId(null)
    setValorPagamento('')
    carregar()
  }

  async function handleDelete(id: number) {
    await supabase.from('dividas').delete().eq('id', id)
    carregar()
  }

  const ativas = dividas.filter(d => !d.quitada)
  const quitadas = dividas.filter(d => d.quitada)

  const ordenadas = useMemo(() => {
    const lista = [...ativas]
    if (estrategia === 'snowball') {
      lista.sort((a, b) => (Number(a.valor_total) - Number(a.valor_pago)) - (Number(b.valor_total) - Number(b.valor_pago)))
    } else {
      lista.sort((a, b) => Number(b.taxa_juros) - Number(a.taxa_juros))
    }
    return lista
  }, [ativas, estrategia])

  const totalDivida = ativas.reduce((s, d) => s + Number(d.valor_total), 0)
  const totalPago = ativas.reduce((s, d) => s + Number(d.valor_pago), 0)
  const totalRestante = totalDivida - totalPago
  const totalMinimo = ativas.reduce((s, d) => s + Number(d.pagamento_minimo), 0)

  function calcularPrevisao(extra: number): { meses: number; totalJuros: number } | null {
    const restante = ativas.map(d => ({
      saldo: Number(d.valor_total) - Number(d.valor_pago),
      taxaMensal: Number(d.taxa_juros) / 100 / 12,
      minimo: Number(d.pagamento_minimo),
    }))
    if (restante.length === 0 || restante.every(r => r.saldo <= 0)) return null

    let meses = 0
    let totalJuros = 0
    const saldos = restante.map(r => r.saldo)
    const maxIter = 600

    while (meses < maxIter) {
      meses++
      let sobrou = extra

      for (let i = 0; i < saldos.length; i++) {
        if (saldos[i] <= 0) continue
        const juros = saldos[i] * restante[i].taxaMensal
        totalJuros += juros
        saldos[i] += juros
        const pagamento = Math.min(restante[i].minimo + (sobrou > 0 ? sobrou : 0), saldos[i])
        sobrou = restante[i].minimo + sobrou - pagamento
        saldos[i] -= pagamento
        if (saldos[i] < 0) sobrou += Math.abs(saldos[i])
      }

      if (saldos.every(s => s <= 0)) break
    }

    return { meses, totalJuros }
  }

  const simResult = useMemo(() => {
    if (!simulando || !aporteExtra) return null
    return calcularPrevisao(parseFloat(aporteExtra) || 0)
  }, [simulando, aporteExtra, ativas])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Desfudência</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-rose-300 mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span className="metric-label">Total devido</span>
          </div>
          <p className="metric-value text-despesa">{formatar(totalRestante)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 text-white/50 mb-1.5">
            <span className="metric-label">Valor original</span>
          </div>
          <p className="metric-value text-white">{formatar(totalDivida)}</p>
        </div>
        <div className="metric-card metric-card-receita">
          <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
            <CheckCircle className="w-4 h-4" />
            <span className="metric-label">Já pago</span>
          </div>
          <p className="metric-value text-emerald-300">{formatar(totalPago)}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-cyan-300 mb-1.5">
            <Calculator className="w-4 h-4" />
            <span className="metric-label">Parcela mínima</span>
          </div>
          <p className="metric-value text-cyan-300">{formatar(totalMinimo)}</p>
        </div>
      </div>

      {totalDivida > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white/70 mb-3">Progresso Geral</h3>
          <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min((totalPago / totalDivida) * 100, 100)}%` }} />
          </div>
          <p className="text-sm text-white/40 mt-2">
            {((totalPago / totalDivida) * 100).toFixed(1)}% pago — falta {formatar(totalRestante)}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Nova Dívida</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="text" required placeholder="Descrição"
              className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input type="number" required min="0.01" step="0.01" placeholder="Valor total"
              className="input-glass" value={valorTotal} onChange={e => setValorTotal(e.target.value)} />
            <input type="number" min="0" step="0.1" placeholder="Juros % a.m."
              className="input-glass" value={taxaJuros} onChange={e => setTaxaJuros(e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder="Pgto mínimo"
              className="input-glass" value={pagamentoMinimo} onChange={e => setPagamentoMinimo(e.target.value)} />
            <input type="date" placeholder="Vencimento"
              className="input-glass" value={dataVenc} onChange={e => setDataVenc(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
          </div>
        </form>
      )}

      {ativas.length > 0 && (
        <>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <Brain className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Estratégia de Pagamento</h3>
              </div>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                <button onClick={() => setEstrategia('snowball')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${estrategia === 'snowball'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-white/40 hover:text-white/70'}`}>
                  Bola de Neve
                </button>
                <button onClick={() => setEstrategia('avalanche')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${estrategia === 'avalanche'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/40 hover:text-white/70'}`}>
                  Avalanche
                </button>
              </div>
            </div>
            <p className="text-xs text-white/30">
              {estrategia === 'snowball'
                ? 'Ordena do menor saldo para o maior. Você ganha impulso psicológico pagando dívidas pequenas primeiro.'
                : 'Ordena da maior taxa de juros para a menor. Você economiza mais dinheiro no longo prazo.'}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <Calculator className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Simulador — Quanto você pode pagar por mês?</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs text-white/40 mb-1">Aporte extra mensal (fora as parcelas mínimas)</label>
                <input type="number" min="0" step="0.01" placeholder="Ex: 500,00"
                  className="input-glass" value={aporteExtra}
                  onChange={e => { setAporteExtra(e.target.value); setSimulando(true) }} />
              </div>
            </div>
            {simResult && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-emerald-300 mx-auto mb-1" />
                  <p className="text-xs text-white/40">Livre em</p>
                  <p className="text-lg font-bold text-emerald-300">
                    {simResult.meses < 12
                      ? `${simResult.meses} ${simResult.meses === 1 ? 'mês' : 'meses'}`
                      : `${Math.floor(simResult.meses / 12)}a ${simResult.meses % 12}m`}
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                  <TrendingDown className="w-5 h-5 text-amber-300 mx-auto mb-1" />
                  <p className="text-xs text-white/40">Total de juros</p>
                  <p className="text-lg font-bold text-amber-300">{formatar(simResult.totalJuros)}</p>
                </div>
              </div>
            )}
            {!aporteExtra && (
              <p className="text-xs text-white/30 mt-2">Digite um valor para simular sua liberdade financeira</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/70">Dívidas ({ordenadas.length})</h2>
              <span className="text-xs text-white/30">
                {estrategia === 'snowball' ? '⬆ Menor saldo primeiro' : '⬇ Maior juro primeiro'}
              </span>
            </div>
            <div className="space-y-3">
              {ordenadas.map((d, idx) => {
                const saldoRestante = Number(d.valor_total) - Number(d.valor_pago)
                const progresso = (Number(d.valor_pago) / Number(d.valor_total)) * 100
                return (
                  <div key={d.id} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold text-white/50">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-white">{d.descricao}</h4>
                      {d.data_vencimento && (
                        <span className="text-xs text-white/30">
                          até {new Date(d.data_vencimento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-white/30 text-xs">Total</span>
                        <p className="text-white font-medium">{formatar(Number(d.valor_total))}</p>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Falta</span>
                        <p className="text-rose-300 font-medium">{formatar(saldoRestante)}</p>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Pago</span>
                        <p className="text-emerald-300 font-medium">{formatar(Number(d.valor_pago))}</p>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Juros</span>
                        <p className="text-amber-300 font-medium">{Number(d.taxa_juros).toFixed(1)}% a.m.</p>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Mínimo</span>
                        <p className="text-cyan-300 font-medium">{formatar(Number(d.pagamento_minimo))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(progresso, 100)}%` }} />
                      </div>
                      <span className="text-xs text-white/30 w-10 text-right">{progresso.toFixed(0)}%</span>
                      <button onClick={() => setPagandoId(pagandoId === d.id ? null : d.id)}
                        className="btn-primary text-xs px-3 py-1.5">
                        Pagar
                      </button>
                      <button onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-300 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {pagandoId === d.id && (
                      <form onSubmit={(e) => { e.preventDefault(); handlePagar(d) }}
                        className="mt-3 flex gap-2 items-end pt-3 border-t border-white/10">
                        <div className="flex-1">
                          <label className="block text-xs text-white/40 mb-1">Valor do pagamento</label>
                          <input type="number" required min="0.01" step="0.01" placeholder="0,00"
                            className="input-glass" value={valorPagamento}
                            onChange={e => setValorPagamento(e.target.value)} autoFocus />
                        </div>
                        <button type="submit" className="btn-primary">
                          Confirmar
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {ativas.length === 0 && quitadas.length === 0 && (
        <div className="glass-card text-center py-12">
          <PiggyBank className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-white/30 text-sm">Nenhuma dívida cadastrada</p>
        </div>
      )}

      {ativas.length === 0 && quitadas.length > 0 && (
        <div className="glass-card text-center py-12">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
          <p className="text-emerald-300/70 text-sm font-semibold">Todas as dívidas quitadas! 🎉</p>
        </div>
      )}

      {quitadas.length > 0 && (
        <details className="group glass-card">
          <summary className="p-5 cursor-pointer flex items-center justify-between text-white/70 font-semibold
            [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span className="text-sm">Dívidas Quitadas ({quitadas.length})</span>
            </div>
            <span className="text-xs text-white/30 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-5 pb-5 space-y-2">
            {quitadas.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white/70 font-medium">{d.descricao}</span>
                  <span className="text-white/30 text-sm ml-2">{formatar(Number(d.valor_total))}</span>
                </div>
                <span className="badge badge-receita">Quitada</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
