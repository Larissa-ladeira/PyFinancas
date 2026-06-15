import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { MESES_PT } from '../types'
import {
  TrendingUp, Trash2, Plus, Save, CheckCircle, AlertCircle
} from 'lucide-react'

const CATEGORIAS_EXTRA = ['Freelance', 'Investimentos', 'Presente', 'Renda Extra', 'Outros']

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RendaExtra() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_EXTRA[0])
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => { carregar() }, [mes, ano])

  async function carregar() {
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('transacoes').select('*')
      .eq('tipo', 'receita')
      .gte('data_transacao', inicio).lt('data_transacao', fim)
      .order('data_transacao', { ascending: false })
    setTransacoes(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('transacoes').insert({
      usuario_id: user?.id,
      descricao, valor: parseFloat(valor), tipo: 'receita', categoria, data_transacao: data,
    })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
      setDescricao('')
      setValor('')
      setData(new Date().toISOString().split('T')[0])
      setCategoria(CATEGORIAS_EXTRA[0])
      carregar()
      setTimeout(() => setSuccess(false), 2000)
    }
    setLoading(false)
  }

  async function handleDelete(id: number) {
    await supabase.from('transacoes').delete().eq('id', id)
    carregar()
  }

  const totalExtra = transacoes.reduce((s, t) => s + Number(t.valor), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Renda Extra</h1>
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="select-glass w-auto">
            {MESES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="select-glass w-auto">
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="metric-card metric-card-receita">
        <div className="flex items-center gap-2 text-emerald-300 mb-1.5">
          <TrendingUp className="w-4 h-4" />
          <span className="metric-label">Total de Renda Extra</span>
        </div>
        <p className="metric-value text-emerald-300">{formatar(totalExtra)}</p>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <Plus className="w-4 h-4" />
          <h2 className="font-semibold text-sm">Nova Renda Extra</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="select-glass">
              {CATEGORIAS_EXTRA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Descrição</label>
            <input type="text" required placeholder="Ex: Freela, Dividendos, etc."
              className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Valor (R$)</label>
              <input type="number" required min="0.01" step="0.01" placeholder="0,00"
                className="input-glass" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Data</label>
              <input type="date" required className="input-glass"
                value={data} onChange={e => setData(e.target.value)} />
            </div>
          </div>
          {errorMsg && (
            <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm rounded-xl p-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Renda extra salva com sucesso!
            </div>
          )}
          <button type="submit" disabled={loading || success}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : success ? 'Salvo!' : 'Salvar Renda Extra'}
          </button>
        </form>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-4">
          Lançamentos ({transacoes.length})
        </h2>
        {transacoes.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="table-glass">
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th className="text-right w-20">Ações</th></tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  <tr key={t.id}>
                    <td className="text-white/40 whitespace-nowrap">{t.data_transacao}</td>
                    <td className="text-white/80 font-medium">{t.descricao}</td>
                    <td><span className="badge badge-receita">{t.categoria}</span></td>
                    <td className="text-right font-semibold text-emerald-300 whitespace-nowrap">
                      +{formatar(Number(t.valor))}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-300 transition-all align-middle">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/30 text-sm py-4 text-center">Nenhuma renda extra neste mês</p>
        )}
      </div>
    </div>
  )
}
