import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatar } from '../lib/format'
import type { Acordo } from '../types'
import { Handshake, Plus, Trash2, CheckCircle, TrendingDown, AlertCircle, Pencil, Save } from 'lucide-react'

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
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editCredor, setEditCredor] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editValorTotal, setEditValorTotal] = useState('')
  const [editValorParcela, setEditValorParcela] = useState('')
  const [editParcelas, setEditParcelas] = useState('')
  const [editDataInicio, setEditDataInicio] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editErrorMsg, setEditErrorMsg] = useState('')

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

  function iniciarEdicao(a: Acordo) {
    setEditandoId(a.id)
    setEditCredor(a.credor)
    setEditDescricao(a.descricao || '')
    setEditValorTotal(String(a.valor_total))
    setEditValorParcela(String(a.valor_parcela))
    setEditParcelas(String(a.parcelas))
    setEditDataInicio(a.data_inicio || '')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditErrorMsg('')
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId) return
    setEditLoading(true)
    setEditErrorMsg('')
    const { error } = await supabase.from('acordos').update({
      credor: editCredor,
      descricao: editDescricao || null,
      valor_total: parseFloat(editValorTotal),
      valor_parcela: parseFloat(editValorParcela),
      parcelas: parseInt(editParcelas),
      data_inicio: editDataInicio || null,
    }).eq('id', editandoId)
    if (error) {
      setEditErrorMsg(error.message)
    } else {
      setEditandoId(null)
      carregar()
    }
    setEditLoading(false)
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
          <div className="flex items-center gap-2 text-accent-pink mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span className="metric-label">Total em parcelas</span>
          </div>
          <p className="metric-value text-accent-pink">{formatar(totalMensal)}/mês</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 text-amber-300 mb-1.5">
            <Handshake className="w-4 h-4" />
            <span className="metric-label">Acordos ativos</span>
          </div>
          <p className="metric-value text-white">{ativos.length}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-accent-purple mb-1.5">
            <AlertCircle className="w-4 h-4" />
            <span className="metric-label">Total a pagar</span>
          </div>
          <p className="metric-value text-accent-purple">{formatar(totalRestante)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Novo Acordo</h3>
          {errorMsg && (
            <div className="bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-sm rounded-xl p-3">
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
                editandoId === a.id ? (
                  <div key={a.id} className="glass-card p-4">
                    <form onSubmit={handleEditSave} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Credor</label>
                          <input type="text" required className="input-glass" value={editCredor}
                            onChange={e => setEditCredor(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Descrição</label>
                          <input type="text" className="input-glass" value={editDescricao}
                            onChange={e => setEditDescricao(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Valor total</label>
                          <input type="number" required min="0.01" step="0.01" className="input-glass" value={editValorTotal}
                            onChange={e => setEditValorTotal(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Valor da parcela</label>
                          <input type="number" required min="0.01" step="0.01" className="input-glass" value={editValorParcela}
                            onChange={e => setEditValorParcela(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Parcelas</label>
                          <input type="number" required min="1" className="input-glass" value={editParcelas}
                            onChange={e => setEditParcelas(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Data de início</label>
                          <input type="date" className="input-glass" value={editDataInicio}
                            onChange={e => setEditDataInicio(e.target.value)} />
                        </div>
                      </div>
                      {editErrorMsg && (
                        <p className="text-xs text-accent-pink">{editErrorMsg}</p>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={editLoading}
                          className="btn-primary flex-1 flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" />
                          {editLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button type="button" onClick={cancelarEdicao}
                          className="btn-outline flex-1">Cancelar</button>
                      </div>
                    </form>
                  </div>
                ) : (
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
                        <p className="text-lg font-bold text-accent-pink -mt-0.5">
                          {formatar(Number(a.valor_parcela))}
                        </p>
                        <p className="text-xs text-white/30">de {formatar(Number(a.valor_total))}</p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${a.quitada ? 'bg-accent-blue' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(progresso, 100)}%` }} />
                    </div>
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                      {!a.quitada && (
                        <button onClick={() => handlePagarParcela(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-blue/20 hover:text-accent-blue transition-all">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Pagar parcela
                        </button>
                      )}
                      <button onClick={() => iniciarEdicao(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-blue/20 hover:text-accent-blue transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-pink/20 hover:text-accent-pink transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                )
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
