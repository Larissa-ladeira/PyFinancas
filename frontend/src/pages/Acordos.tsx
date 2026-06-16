import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Acordo } from '../types'
import { Handshake, Plus, Trash2, CheckCircle, TrendingDown, AlertCircle } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Acordos() {
  const [acordos, setAcordos] = useState<Acordo[]>([])
  const [credor, setCredor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [valorParcela, setValorParcela] = useState('')
  const [parcelas, setParcelas] = useState('1')
  const [dataInicio, setDataInicio] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('acordos').select('*')
      .order('quitada', { ascending: true })
      .order('created_at', { ascending: false })
    setAcordos(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('acordos').insert({
      usuario_id: user?.id,
      credor: credor,
      descricao: descricao || null,
      valor_total: parseFloat(valorTotal),
      valor_parcela: parseFloat(valorParcela),
      parcelas: parseInt(parcelas),
      data_inicio: dataInicio || null,
    })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setCredor('')
      setDescricao('')
      setValorTotal('')
      setValorParcela('')
      setParcelas('1')
      setDataInicio('')
      setShowForm(false)
      carregar()
    }
    setLoading(false)
  }

  async function handlePagarParcela(a: Acordo) {
    const novasPagas = a.parcelas_pagas + 1
    const quitada = novasPagas >= a.parcelas
    await supabase.from('acordos').update({
      parcelas_pagas: novasPagas,
      quitada,
    }).eq('id', a.id)
    carregar()
  }

  async function handleDelete(id: number) {
    await supabase.from('acordos').delete().eq('id', id)
    carregar()
  }

  const ativos = acordos.filter(a => !a.quitada)
  const totalMensal = ativos.reduce((s, a) => s + Number(a.valor_parcela), 0)
  const totalRestante = ativos.reduce((s, a) => s + (Number(a.parcelas) - Number(a.parcelas_pagas)) * Number(a.valor_parcela), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Acordos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo Acordo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-pink-300 mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span className="metric-label">Total em parcelas</span>
          </div>
          <p className="metric-value text-despesa">{formatar(totalMensal)}/mês</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 text-amber-300 mb-1.5">
            <Handshake className="w-4 h-4" />
            <span className="metric-label">Acordos ativos</span>
          </div>
          <p className="metric-value text-white">{ativos.length}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-purple-300 mb-1.5">
            <AlertCircle className="w-4 h-4" />
            <span className="metric-label">Total a pagar</span>
          </div>
          <p className="metric-value text-purple-300">{formatar(totalRestante)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Novo Acordo</h3>
          {errorMsg && (
            <div className="bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm rounded-xl p-3">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Credor</label>
              <input type="text" required placeholder="Ex: Banco X, Serasa, etc."
                className="input-glass" value={credor} onChange={e => setCredor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Descrição (opcional)</label>
              <input type="text" placeholder="Ex: Acordo do cartão"
                className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Valor total do acordo</label>
              <input type="number" required min="0.01" step="0.01" placeholder="0,00"
                className="input-glass" value={valorTotal} onChange={e => setValorTotal(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Valor da parcela</label>
              <input type="number" required min="0.01" step="0.01" placeholder="0,00"
                className="input-glass" value={valorParcela} onChange={e => setValorParcela(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Total de parcelas</label>
              <input type="number" required min="1" step="1"
                className="input-glass" value={parcelas} onChange={e => setParcelas(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Data de início</label>
              <input type="date" className="input-glass"
                value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Acordo'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
          </div>
        </form>
      )}

      <div className="glass-card p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-4">
          Todos os Acordos ({acordos.length})
        </h2>
        {acordos.length > 0 ? (
          <div className="space-y-3">
            {acordos.map(a => {
              const progresso = a.parcelas > 0 ? (a.parcelas_pagas / a.parcelas) * 100 : 0
              return (
                <div key={a.id} className={`glass-card p-4 ${a.quitada ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{a.credor}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {a.descricao && <span className="text-xs text-white/40">{a.descricao}</span>}
                        {a.data_inicio && <span className="text-xs text-white/30">desde {a.data_inicio}</span>}
                        <span className={`badge ${a.quitada ? 'badge-receita' : 'badge-despesa'}`}>
                          {a.quitada ? 'Quitado' : `${a.parcelas_pagas}/${a.parcelas}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-pink-300 -mt-0.5">
                        {formatar(Number(a.valor_parcela))}
                      </p>
                      <p className="text-xs text-white/30">de {formatar(Number(a.valor_total))}</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${a.quitada ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(progresso, 100)}%` }} />
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                    {!a.quitada && (
                      <button onClick={() => handlePagarParcela(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-blue-500/20 hover:text-blue-300 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pagar parcela
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-pink-500/20 hover:text-pink-300 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-white/30 text-sm py-8 text-center">Nenhum acordo cadastrado</p>
        )}
      </div>
    </div>
  )
}
