import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatar } from '../lib/format'
import type { MetaEconomia } from '../types'
import { Target, Plus, Trash2, PiggyBank, Calendar, Pencil, Save, X } from 'lucide-react'

export default function MetasEconomia() {
  const [metas, setMetas] = useState<MetaEconomia[]>([])
  const [descricao, setDescricao] = useState('')
  const [valorAlvo, setValorAlvo] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [dataAlvo, setDataAlvo] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [editandoMetaId, setEditandoMetaId] = useState<number | null>(null)
  const [editMetaDescricao, setEditMetaDescricao] = useState('')
  const [editMetaValorAlvo, setEditMetaValorAlvo] = useState('')
  const [editMetaDataAlvo, setEditMetaDataAlvo] = useState('')
  const [editandoProgressoId, setEditandoProgressoId] = useState<number | null>(null)
  const [editMetaValor, setEditMetaValor] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioId(data.user.id)
    })
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('metas_economia').select('*')
      .order('concluida', { ascending: true })
      .order('created_at', { ascending: false })
    setMetas(data || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('metas_economia').insert({
      usuario_id: usuarioId,
      descricao,
      valor_alvo: parseFloat(valorAlvo),
      valor_atual: parseFloat(valorAtual) || 0,
      data_alvo: dataAlvo || null,
    })
    setDescricao(''); setValorAlvo(''); setValorAtual(''); setDataAlvo('')
    setShowForm(false)
    setLoading(false)
    carregar()
  }

  function iniciarEdicaoMeta(m: MetaEconomia) {
    setEditandoMetaId(m.id)
    setEditMetaDescricao(m.descricao)
    setEditMetaValorAlvo(String(m.valor_alvo))
    setEditMetaDataAlvo(m.data_alvo || '')
  }

  function cancelarEdicaoMeta() {
    setEditandoMetaId(null)
  }

  async function handleEditMetaSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoMetaId) return
    await supabase.from('metas_economia').update({
      descricao: editMetaDescricao,
      valor_alvo: parseFloat(editMetaValorAlvo),
      data_alvo: editMetaDataAlvo || null,
    }).eq('id', editandoMetaId)
    setEditandoMetaId(null)
    carregar()
  }

  function iniciarEdicaoProgresso(m: MetaEconomia) {
    setEditandoProgressoId(m.id)
    setEditMetaValor(String(m.valor_atual))
  }

  function cancelarEdicaoProgresso() {
    setEditandoProgressoId(null)
  }

  async function handleEditProgressoSave(m: MetaEconomia) {
    const val = parseFloat(editMetaValor.replace(',', '.'))
    if (isNaN(val)) return
    const concluida = val >= m.valor_alvo
    await supabase.from('metas_economia').update({ valor_atual: val, concluida }).eq('id', m.id)
    setEditandoProgressoId(null)
    carregar()
  }

  async function handleDelete(id: number) {
    await supabase.from('metas_economia').delete().eq('id', id)
    carregar()
  }

  const pendentes = metas.filter(m => !m.concluida)
  const concluidas = metas.filter(m => m.concluida)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Metas de Economia</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Meta
        </button>
      </div>

      {metas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="metric-card metric-card-receita">
            <div className="flex items-center gap-2 text-accent-blue mb-1.5">
              <Target className="w-4 h-4" />
              <span className="metric-label">Metas ativas</span>
            </div>
            <p className="metric-value text-accent-blue">{pendentes.length}</p>
          </div>
          <div className="metric-card metric-card-despesa">
            <div className="flex items-center gap-2 text-accent-purple mb-1.5">
              <PiggyBank className="w-4 h-4" />
              <span className="metric-label">Total economizado</span>
            </div>
            <p className="metric-value text-accent-purple">
              {formatar(metas.reduce((s, m) => s + m.valor_atual, 0))}
            </p>
          </div>
          <div className="metric-card metric-card-saldo">
            <div className="flex items-center gap-2 text-accent-pink mb-1.5">
              <Target className="w-4 h-4" />
              <span className="metric-label">Total das metas</span>
            </div>
            <p className="metric-value text-accent-pink">
              {formatar(metas.reduce((s, m) => s + m.valor_alvo, 0))}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Nova Meta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" required placeholder="Descrição (ex: Viagem dos sonhos)"
              className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input type="number" required min="0.01" step="0.01" placeholder="Valor alvo"
              className="input-glass" value={valorAlvo} onChange={e => setValorAlvo(e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder="Já guardou algo?"
              className="input-glass" value={valorAtual} onChange={e => setValorAtual(e.target.value)} />
            <input type="date" placeholder="Data alvo (opcional)"
              className="input-glass" value={dataAlvo} onChange={e => setDataAlvo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Criar Meta'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white/70">Em andamento ({pendentes.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendentes.map(m => {
            const progresso = (m.valor_atual / m.valor_alvo) * 100
            const diasRestantes = m.data_alvo
              ? Math.max(0, Math.ceil((new Date(m.data_alvo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null
            return (
              <div key={m.id} className="glass-card p-5">
                {editandoMetaId === m.id ? (
                  <form onSubmit={handleEditMetaSave} className="space-y-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Descrição</label>
                      <input type="text" required className="input-glass" value={editMetaDescricao}
                        onChange={e => setEditMetaDescricao(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Valor alvo</label>
                        <input type="number" required min="0.01" step="0.01" className="input-glass" value={editMetaValorAlvo}
                          onChange={e => setEditMetaValorAlvo(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Data alvo</label>
                        <input type="date" className="input-glass" value={editMetaDataAlvo}
                          onChange={e => setEditMetaDataAlvo(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                      <button type="button" onClick={cancelarEdicaoMeta}
                        className="btn-outline flex-1">Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{m.descricao}</h4>
                        {diasRestantes !== null && (
                          <span className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {diasRestantes} dias restantes
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => iniciarEdicaoMeta(m)}
                          className="p-1.5 rounded-lg hover:bg-accent-blue/20 text-white/30 hover:text-accent-blue transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg hover:bg-accent-pink/20 text-white/30 hover:text-accent-pink transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/40">{formatar(m.valor_atual)}</span>
                      <span className="text-white font-medium">{formatar(m.valor_alvo)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all"
                        style={{ width: `${Math.min(progresso, 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30">{progresso.toFixed(1)}% concluído</span>
                      {editandoProgressoId === m.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" step="0.01" className="input-glass !py-1 !px-2 !text-xs w-28"
                            value={editMetaValor} onChange={e => setEditMetaValor(e.target.value)} autoFocus />
                          <button onClick={() => handleEditProgressoSave(m)}
                            className="text-xs text-accent-blue hover:text-accent-blue/80">ok</button>
                          <button onClick={cancelarEdicaoProgresso}
                            className="text-xs text-white/30 hover:text-white/60">x</button>
                        </div>
                      ) : (
                        <button onClick={() => iniciarEdicaoProgresso(m)}
                          className="text-xs px-3 py-1.5 rounded-xl bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-all">
                          Atualizar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
          {pendentes.length === 0 && (
            <p className="text-white/30 text-sm col-span-2 text-center py-8">Nenhuma meta ativa</p>
          )}
        </div>
      </div>

      {concluidas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white/70">Concluídas ({concluidas.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {concluidas.map(m => (
              <div key={m.id} className="glass-card p-5 opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{m.descricao}</h4>
                    <span className="text-xs text-accent-blue">Meta concluída!</span>
                  </div>
                  <button onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg hover:bg-accent-pink/20 text-white/30 hover:text-accent-pink transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-accent-blue font-bold">{formatar(m.valor_alvo)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
