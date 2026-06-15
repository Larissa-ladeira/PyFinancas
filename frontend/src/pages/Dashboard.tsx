import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao, Divida, Lembrete } from '../types'
import { MESES_PT } from '../types'
import {
  TrendingUp, TrendingDown, Wallet, PieChart, BarChart3, ArrowUpRight,
  PiggyBank, Target, Bell, Check
} from 'lucide-react'
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [dividas, setDividas] = useState<Divida[]>([])
  const [salario, setSalario] = useState(0)
  const [lembretesMes, setLembretesMes] = useState<Lembrete[]>([])

  useEffect(() => { carregar() }, [mes, ano])
  useEffect(() => {
    supabase.from('dividas').select('*')
      .order('quitada', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => setDividas(data || []))
    supabase.from('configuracoes').select('*').single()
      .then(({ data }) => { if (data) setSalario(Number(data.salario_base)) })
  }, [])

  useEffect(() => {
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    supabase.from('lembretes').select('*')
      .gte('data_vencimento', inicio).lt('data_vencimento', fim)
      .order('data_vencimento', { ascending: false })
      .then(({ data }) => setLembretesMes(data || []))
  }, [mes, ano])

  async function togglePago(id: number, pago: boolean) {
    await supabase.from('lembretes').update({ pago: !pago }).eq('id', id)
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('lembretes').select('*')
      .gte('data_vencimento', inicio).lt('data_vencimento', fim)
      .order('data_vencimento', { ascending: false })
    setLembretesMes(data || [])
  }

  async function carregar() {
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('transacoes').select('*')
      .gte('data_transacao', inicio).lt('data_transacao', fim)
      .order('data_transacao', { ascending: false })
    setTransacoes(data || [])
  }

  async function carregarAno() {
    const inicio = new Date(ano, 0, 1).toISOString().split('T')[0]
    const fim = new Date(ano + 1, 0, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('transacoes').select('*')
      .gte('data_transacao', inicio).lt('data_transacao', fim)
    return (data || []) as Transacao[]
  }

  const receitas = transacoes.filter(t => t.tipo.toLowerCase() === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const despesas = transacoes.filter(t => t.tipo.toLowerCase() === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  const saldo = receitas - despesas

  const ativas = dividas.filter(d => !d.quitada)
  const totalDivida = ativas.reduce((s, d) => s + Number(d.valor_total), 0)
  const totalPago = ativas.reduce((s, d) => s + Number(d.valor_pago), 0)
  const totalRestante = totalDivida - totalPago
  const totalMinimo = ativas.reduce((s, d) => s + Number(d.pagamento_minimo), 0)
  const dividaRatio = salario > 0 ? (totalRestante / salario) * 100 : 0
  const excedente = saldo - totalMinimo

  function calcularLiberdade() {
    const restante = ativas.map(d => ({
      saldo: Number(d.valor_total) - Number(d.valor_pago),
      taxaMensal: Number(d.taxa_juros) / 100 / 12,
      minimo: Number(d.pagamento_minimo),
    }))
    if (restante.length === 0 || excedente <= 0) return null
    if (restante.every(r => r.saldo <= 0)) return 0
    const saldos = restante.map(r => r.saldo)
    for (let meses = 1; meses <= 600; meses++) {
      let sobrou = excedente
      for (let i = 0; i < saldos.length; i++) {
        if (saldos[i] <= 0) continue
        saldos[i] += saldos[i] * restante[i].taxaMensal
        const pagamento = Math.min(restante[i].minimo + sobrou, saldos[i])
        sobrou = restante[i].minimo + sobrou - pagamento
        saldos[i] -= pagamento
        if (saldos[i] < 0) sobrou += Math.abs(saldos[i])
      }
      if (saldos.every(s => s <= 0)) return meses
    }
    return null
  }

  const mesesLiberdade = calcularLiberdade()

  const despCat = transacoes.filter(t => t.tipo.toLowerCase() === 'despesa')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor); return acc
    }, {})
  const pieData = Object.entries(despCat).map(([name, value]) => ({ name, value }))

  const [dadosAno, setDadosAno] = useState<{ mes: number; Receitas: number; Despesas: number }[]>([])
  useEffect(() => {
    carregarAno().then(lista => {
      const agrupado: Record<number, { Receitas: number; Despesas: number }> = {}
      for (let i = 1; i <= 12; i++) agrupado[i] = { Receitas: 0, Despesas: 0 }
      for (const t of lista) {
        const m = new Date(t.data_transacao).getMonth() + 1
        if (t.tipo.toLowerCase() === 'receita') agrupado[m].Receitas += Number(t.valor)
        else agrupado[m].Despesas += Number(t.valor)
      }
      setDadosAno(Object.entries(agrupado).map(([m, v]) => ({ mes: Number(m), ...v })))
    })
  }, [ano])

  const TooltipCustom = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-card px-4 py-3 text-sm">
        <p className="text-white/60 mb-1">{MESES_PT[label - 1] || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {formatar(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="select-glass w-auto">
            {MESES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="select-glass w-auto">
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card metric-card-receita">
          <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="metric-label">Receitas</span>
          </div>
          <p className="metric-value text-emerald-300">{formatar(receitas)}</p>
        </div>
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-rose-300 mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span className="metric-label">Despesas</span>
          </div>
          <p className="metric-value text-despesa">{formatar(despesas)}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-cyan-300 mb-1.5">
            <Wallet className="w-4 h-4" />
            <span className="metric-label">Saldo</span>
          </div>
          <p className={`metric-value ${saldo >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>{formatar(saldo)}</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <Bell className="w-4 h-4" />
          <h2 className="font-semibold text-sm">Compromissos do Mês</h2>
        </div>

        {(() => {
          const pendentes = lembretesMes.filter(l => !l.pago)
          const totalPendente = pendentes.reduce((s, l) => s + Number(l.valor), 0)
          const gastoMes = despesas
          const compromissoTotal = totalPendente + gastoMes
          const salarioLiquido = salario - compromissoTotal
          const percComprometido = salario > 0 ? (compromissoTotal / salario) * 100 : 0

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-xs text-white/40">A pagar (lembretes)</span>
                  <p className="text-lg font-bold text-amber-300">{formatar(totalPendente)}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">Já gasto (transações)</span>
                  <p className="text-lg font-bold text-rose-300">{formatar(gastoMes)}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">Total comprometido</span>
                  <p className="text-lg font-bold text-white">{formatar(compromissoTotal)}</p>
                </div>
                <div>
                  <span className="text-xs text-white/40">% do salário</span>
                  <p className={`text-lg font-bold ${percComprometido > 70 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {percComprometido.toFixed(1)}%
                  </p>
                </div>
              </div>

              {salario > 0 && (
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${percComprometido > 70 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(percComprometido, 100)}%` }} />
                </div>
              )}

              {salarioLiquido > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-emerald-200">
                    Saldo livre após compromissos: <strong>{formatar(salarioLiquido)}</strong>
                  </p>
                </div>
              )}
              {salarioLiquido <= 0 && salario > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-rose-200">
                    Seus compromissos excedem seu salário em <strong>{formatar(Math.abs(salarioLiquido))}</strong>
                  </p>
                </div>
              )}

              {pendentes.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-white/50 hover:text-white/70 transition-colors
                    [&::-webkit-details-marker]:hidden">
                    {pendentes.length} lembrete(s) pendente(s) — clique para ver ▼
                  </summary>
                  <div className="mt-3 space-y-2">
                    {pendentes.map(l => (
                      <div key={l.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                          <button onClick={() => togglePago(l.id, l.pago)}
                            className="w-5 h-5 rounded border border-amber-500/50 flex items-center justify-center
                              hover:bg-emerald-500/20 hover:border-emerald-500 transition-all">
                          </button>
                          <div>
                            <p className="text-sm text-white/80 font-medium">{l.descricao}</p>
                            <p className="text-xs text-white/30">
                              Vence {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-amber-300">{formatar(Number(l.valor))}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {pendentes.length === 0 && (
                <p className="text-sm text-emerald-300/70 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Nenhum lembrete pendente neste mês
                </p>
              )}
            </>
          )
        })()}
      </div>

      {(totalRestante > 0 || excedente > 0) && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <Target className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Jornada da Desfudência</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-white/40">Dívida restante</span>
              <p className="text-lg font-bold text-rose-300">{formatar(totalRestante)}</p>
            </div>
            <div>
              <span className="text-xs text-white/40">Parcelas mínimas</span>
              <p className="text-lg font-bold text-cyan-300">{formatar(totalMinimo)}/mês</p>
            </div>
            <div>
              <span className="text-xs text-white/40">Excedente mensal</span>
              <p className={`text-lg font-bold ${excedente > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatar(excedente)}
              </p>
            </div>
            <div>
              <span className="text-xs text-white/40">Dívida / Renda</span>
              <p className={`text-lg font-bold ${dividaRatio < 50 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {dividaRatio.toFixed(1)}%
              </p>
            </div>
          </div>
          {totalDivida > 0 && (
            <div className="mt-3 w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min((totalPago / totalDivida) * 100, 100)}%` }} />
            </div>
          )}
          {mesesLiberdade !== null && mesesLiberdade > 0 && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-300 shrink-0" />
              <p className="text-sm text-emerald-200">
                Pagando <strong>{formatar(excedente)}</strong> por mês além das parcelas mínimas,
                você estará livre das dívidas em{' '}
                <strong>
                  {mesesLiberdade < 12
                    ? `${mesesLiberdade} ${mesesLiberdade === 1 ? 'mês' : 'meses'}`
                    : `${Math.floor(mesesLiberdade / 12)}a ${mesesLiberdade % 12}m`}
                </strong>
              </p>
            </div>
          )}
          {mesesLiberdade === 0 && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-300 shrink-0" />
              <p className="text-sm text-emerald-200">Você não tem dívidas ativas. 🎉</p>
            </div>
          )}
          {excedente <= 0 && totalRestante > 0 && (
            <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <p className="text-sm text-rose-200">
                Suas despesas + parcelas mínimas estão maiores que sua receita.
                Reveja seus gastos para conseguir abrir margem para pagar as dívidas.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <PieChart className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Despesas por Categoria</h2>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<TooltipCustom />} />
                <Legend formatter={(v: string) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v}</span>} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/30 text-sm py-8 text-center">Nenhuma despesa no período</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <BarChart3 className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Evolução Mensal</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosAno}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tickFormatter={m => MESES_PT[m - 1].slice(0, 3)}
                tick={{ fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip content={<TooltipCustom />} />
              <Legend formatter={(v: string) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v}</span>} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card">
        <details className="group">
          <summary className="p-5 cursor-pointer flex items-center justify-between text-white/70 font-semibold
            [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm">Últimas Transações</span>
            </div>
            <span className="text-xs text-white/30 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-5 pb-5 overflow-x-auto scrollbar-hide">
            {transacoes.length > 0 ? (
              <table className="table-glass">
                <thead>
                  <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th className="text-right">Valor</th></tr>
                </thead>
                <tbody>
                  {transacoes.slice(0, 10).map(t => (
                    <tr key={t.id}>
                      <td className="text-white/40 whitespace-nowrap">{t.data_transacao}</td>
                      <td className="text-white/80 font-medium">{t.descricao}</td>
                      <td className="text-white/50">{t.categoria}</td>
                      <td>
                        <span className={`badge ${t.tipo.toLowerCase() === 'receita' ? 'badge-receita' : 'badge-despesa'}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className={`text-right font-semibold whitespace-nowrap
                        ${t.tipo.toLowerCase() === 'receita' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {t.tipo.toLowerCase() === 'receita' ? '+' : '-'}{formatar(Number(t.valor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-white/30 text-sm py-4 text-center">Nenhuma transação neste período</p>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}
