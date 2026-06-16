import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { MESES_PT } from '../types'
import {
  BarChart3, TrendingUp, TrendingDown, Wallet, Award, AlertTriangle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#00D4FF', '#FF2E9A', '#A855F7', '#ffffff', '#f59e0b', '#00D4FF', '#FF2E9A', '#A855F7', '#ffffff', '#f59e0b']

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Relatorios() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [todas, setTodas] = useState<Transacao[]>([])

  useEffect(() => {
    const inicio = new Date(ano, 0, 1).toISOString().split('T')[0]
    const fim = new Date(ano + 1, 0, 1).toISOString().split('T')[0]
    supabase.from('transacoes').select('*')
      .gte('data_transacao', inicio).lt('data_transacao', fim)
      .order('data_transacao', { ascending: false })
      .then(({ data }) => setTodas(data || []))
  }, [ano])

  const mesesData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mesTransacoes = todas.filter(t => {
        const d = new Date(t.data_transacao)
        return d.getMonth() === i
      })
      const receitas = mesTransacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
      const despesas = mesTransacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
      return { mes: MESES_PT[i], receitas, despesas, saldo: receitas - despesas }
    })
  }, [todas])

  const totalReceitas = todas.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const totalDespesas = todas.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  const totalSaldo = totalReceitas - totalDespesas
  const mediaMensal = totalDespesas / 12

  const despCat = todas.filter(t => t.tipo === 'despesa').reduce<Record<string, number>>((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
    return acc
  }, {})

  const catOrdenadas = Object.entries(despCat).sort((a, b) => b[1] - a[1])

  const melhorMes = mesesData.reduce((best, m) => m.saldo > (best?.saldo ?? -Infinity) ? m : best, mesesData[0])
  const piorMes = mesesData.reduce((worst, m) => m.saldo < (worst?.saldo ?? Infinity) ? m : worst, mesesData[0])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Relatórios Anuais</h1>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} className="select-glass w-auto">
          {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card metric-card-receita">
          <div className="flex items-center gap-2 text-accent-blue mb-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="metric-label">Receitas</span>
          </div>
          <p className="metric-value text-accent-blue">{formatar(totalReceitas)}</p>
        </div>
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-accent-pink mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span className="metric-label">Despesas</span>
          </div>
          <p className="metric-value text-accent-pink">{formatar(totalDespesas)}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-accent-purple mb-1.5">
            <Wallet className="w-4 h-4" />
            <span className="metric-label">Saldo</span>
          </div>
          <p className="metric-value text-accent-purple">{formatar(totalSaldo)}</p>
        </div>
      </div>

      {ano > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <BarChart3 className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Comparativo Mensal</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mesesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(val: any) => formatar(Number(val))}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="receitas" fill="#00D4FF" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#FF2E9A" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-accent-blue mb-4">
            <Award className="w-4 h-4" />
            <h2 className="font-semibold text-sm text-white/70">Melhor mês</h2>
          </div>
          <p className="text-2xl font-bold text-accent-blue">{melhorMes?.mes}</p>
          <p className="text-sm text-white/40 mt-1">
            Saldo positivo de <span className="text-accent-blue font-semibold">{formatar(melhorMes?.saldo || 0)}</span>
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-accent-pink mb-4">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-semibold text-sm text-white/70">Pior mês</h2>
          </div>
          <p className="text-2xl font-bold text-accent-pink">{piorMes?.mes}</p>
          <p className="text-sm text-white/40 mt-1">
            Saldo negativo de <span className="text-accent-pink font-semibold">{formatar(piorMes?.saldo || 0)}</span>
          </p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <TrendingDown className="w-4 h-4" />
          <h2 className="font-semibold text-sm">Resumo do ano</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{formatar(mediaMensal)}</p>
            <p className="text-xs text-white/40">Média mensal de gastos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{catOrdenadas[0]?.[0] || '-'}</p>
            <p className="text-xs text-white/40">Maior categoria de gasto</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-white/40">Receitas comprometidas</p>
          </div>
        </div>
      </div>

      {catOrdenadas.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <PieChart className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Despesas por Categoria (ano todo)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={catOrdenadas.map(([cat, val], i) => ({
                    name: cat, value: val, fill: COLORS[i % COLORS.length]
                  }))} dataKey="value" outerRadius={90} innerRadius={50}>
                    {catOrdenadas.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' }}
                    formatter={(val: any) => formatar(Number(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {catOrdenadas.map(([cat, val], i) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-white/70">{cat}</span>
                  </div>
                  <span className="text-white font-medium">{formatar(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
