import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Lembrete } from '../types'
import { Bell, Plus, Check, Trash2, AlertCircle } from 'lucide-react'
import { MESES_PT } from '../types'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Lembretes() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVenc, setDataVenc] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioId(data.user.id)
    })
  }, [])

  useEffect(() => { carregar() }, [filtroMes, filtroAno])

  async function carregar() {
    const inicio = new Date(filtroAno, filtroMes - 1, 1).toISOString().split('T')[0]
    const fim = filtroMes === 12
      ? new Date(filtroAno + 1, 0, 1).toISOString().split('T')[0]
      : new Date(filtroAno, filtroMes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('lembretes').select('*')
      .gte('data_vencimento', inicio).lt('data_vencimento', fim)
      .order('data_vencimento', { ascending: true })
    setLembretes(data || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { error } = await supabase.from('lembretes').insert({
      usuario_id: usuarioId,
      descricao, valor: parseFloat(valor), data_vencimento: dataVenc,
    })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setDescricao(''); setValor(''); setDataVenc('')
      setShowForm(false)
      carregar()
    }
    setLoading(false)
  }

  async function togglePago(id: number, pago: boolean) {
    await supabase.from('lembretes').update({ pago: !pago }).eq('id', id)
    carregar()
  }

  async function handleDelete(id: number) {
    await supabase.from('lembretes').delete().eq('id', id)
    carregar()
  }

  const pendentes = lembretes.filter(l => !l.pago)
  const totalPendente = pendentes.reduce((s, l) => s + Number(l.valor), 0)
  const totalPago = lembretes.filter(l => l.pago).reduce((s, l) => s + Number(l.valor), 0)
  const vencidos = pendentes.filter(l => new Date(l.data_vencimento) < new Date())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Lembretes</h1>
        <div className="flex gap-2">
          <select value={filtroMes} onChange={e => setFiltroMes(Number(e.target.value))} className="select-glass w-auto">
            {MESES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filtroAno} onChange={e => setFiltroAno(Number(e.target.value))} className="select-glass w-auto">
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-pink-300 mb-1.5">
            <AlertCircle className="w-4 h-4" />
            <span className="metric-label">Pendentes</span>
          </div>
          <p className="metric-value text-despesa">{formatar(totalPendente)}</p>
          {vencidos.length > 0 && (
            <p className="text-pink-400/70 text-xs mt-1">{vencidos.length} vencido(s)</p>
          )}
        </div>
        <div className="metric-card metric-card-receita">
          <div className="flex items-center gap-2 text-blue-300 mb-1.5">
            <Check className="w-4 h-4" />
            <span className="metric-label">Pagos</span>
          </div>
          <p className="metric-value text-blue-300">{formatar(totalPago)}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-purple-300 mb-1.5">
            <Bell className="w-4 h-4" />
            <span className="metric-label">{MESES_PT[filtroMes - 1]}</span>
          </div>
          <p className="metric-value text-purple-300">{lembretes.length} conta(s)</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Novo Lembrete</h3>
          {errorMsg && (
            <div className="bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm rounded-xl p-3">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" required placeholder="Descrição"
              className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input type="number" required min="0.01" step="0.01" placeholder="Valor"
              className="input-glass" value={valor} onChange={e => setValor(e.target.value)} />
            <input type="date" required className="input-glass"
              value={dataVenc} onChange={e => setDataVenc(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
          </div>
        </form>
      )}

      <div className="glass-card p-5">
        {lembretes.length > 0 ? (
          <div className="space-y-3">
            {lembretes.map(l => {
              const vencida = !l.pago && new Date(l.data_vencimento) < new Date()
              return (
                <div key={l.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{l.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${vencida ? 'text-pink-300 font-medium' : 'text-white/40'}`}>
                          {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                          {vencida && <span className="ml-1 text-pink-400">(vencido)</span>}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-white shrink-0 -mt-0.5">
                      {formatar(Number(l.valor))}
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                    <button onClick={() => togglePago(l.id, l.pago)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        l.pago
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-white/5 text-white/50 hover:bg-blue-500/20 hover:text-blue-300'
                      }`}>
                      <Check className="w-3.5 h-3.5" />
                      {l.pago ? 'Pago' : 'Pendente'}
                    </button>
                    <button onClick={() => handleDelete(l.id)}
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
          <div className="text-center py-12">
            <Bell className="w-8 h-8 mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">Nenhum lembrete para {MESES_PT[filtroMes - 1]}</p>
          </div>
        )}
      </div>
    </div>
  )
}
