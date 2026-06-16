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
        <div className="flex items-center gap-2 text-accent-blue mb-1.5">
          <TrendingUp className="w-4 h-4" />
          <span className="metric-label">Total de Renda Extra</span>
        </div>
        <p className="metric-value text-accent-blue">{formatar(totalExtra)}</p>
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
            <div className="flex items-center gap-2 bg-accent-pink/15 border border-accent-pink/25 text-accent-pink text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm rounded-xl p-3">
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
          <div className="space-y-3">
            {transacoes.map(t => (
              <div key={t.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/40">{t.data_transacao}</span>
                      <span className="badge badge-receita">{t.categoria}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-accent-blue shrink-0 -mt-0.5">
                    +{formatar(Number(t.valor))}
                  </p>
                </div>
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => handleDelete(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-pink/20 hover:text-accent-pink transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm py-4 text-center">Nenhuma renda extra neste mês</p>
        )}
      </div>
    </div>
  )
}
