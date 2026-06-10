import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from '../types'
import { useNavigate } from 'react-router-dom'
import { Save, CheckCircle } from 'lucide-react'

export default function NovaTransacao() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<'Receita' | 'Despesa'>('Despesa')
  const [categoria, setCategoria] = useState(CATEGORIAS_DESPESA[0])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const categorias = tipo === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('transacoes').insert({
      descricao, valor: parseFloat(valor), tipo, categoria, data_transacao: data,
    })
    if (!error) {
      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Nova Transação</h1>
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Tipo</label>
          <div className="flex gap-2">
            {(['Despesa', 'Receita'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setTipo(t); setCategoria(t === 'Receita' ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0]) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
                  ${tipo === t
                    ? t === 'Receita'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="select-glass">
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Descrição</label>
          <input type="text" required placeholder="Ex: Almoço, Freela, etc."
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

        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm rounded-xl p-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Transação salva com sucesso! Redirecionando...
          </div>
        )}

        <button type="submit" disabled={loading || success}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : success ? 'Salvo!' : 'Salvar Transação'}
        </button>
      </form>
    </div>
  )
}
