import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TransacaoRecorrente } from '../types'
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA, MESES_PT } from '../types'
import { Repeat, Plus, Trash2, Play, Pause, CheckCircle } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TransacoesRecorrentes() {
  const [recorrentes, setRecorrentes] = useState<TransacaoRecorrente[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [categoria, setCategoria] = useState('')
  const [dia, setDia] = useState('1')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [gerando, setGerando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('transacoes_recorrentes').select('*')
      .order('ativa', { ascending: false })
      .order('created_at', { ascending: false })
    setRecorrentes(data || [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transacoes_recorrentes').insert({
      usuario_id: user?.id,
      descricao, valor: parseFloat(valor),
      tipo, categoria: categoria || (tipo === 'receita' ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0]),
      dia_vencimento: parseInt(dia),
    })
    setDescricao(''); setValor(''); setDia('1')
    setShowForm(false); setLoading(false); carregar()
  }

  async function toggleAtiva(r: TransacaoRecorrente) {
    await supabase.from('transacoes_recorrentes').update({ ativa: !r.ativa }).eq('id', r.id)
    carregar()
  }

  async function handleDelete(id: number) {
    await supabase.from('transacoes_recorrentes').delete().eq('id', id)
    carregar()
  }

  async function gerarAgora() {
    setGerando(true)
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGerando(false); return }

    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const anoAtual = hoje.getFullYear()

    // Check existing transactions for current month
    const inicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().split('T')[0]
    const fim = mesAtual === 12
      ? new Date(anoAtual + 1, 0, 1).toISOString().split('T')[0]
      : new Date(anoAtual, mesAtual, 1).toISOString().split('T')[0]

    const { data: existentes } = await supabase.from('transacoes').select('descricao, valor')
      .eq('usuario_id', user.id)
      .gte('data_transacao', inicio).lt('data_transacao', fim)

    let criadas = 0
    for (const r of recorrentes) {
      if (!r.ativa) continue
      // Check if already created this month (match descricao + valor)
      const jaExiste = existentes?.some(e =>
        e.descricao === r.descricao && Math.abs(Number(e.valor) - Number(r.valor)) < 0.01
      )
      if (jaExiste) continue

      const diaValido = Math.min(r.dia_vencimento, new Date(anoAtual, mesAtual, 0).getDate())
      const dataTransacao = new Date(anoAtual, mesAtual - 1, diaValido).toISOString().split('T')[0]

      const { error } = await supabase.from('transacoes').insert({
        usuario_id: user.id,
        descricao: r.descricao,
        valor: r.valor,
        tipo: r.tipo,
        categoria: r.categoria,
        data_transacao: dataTransacao,
      })
      if (!error) criadas++
    }
    setMsg(`${criadas} transaç${criadas === 1 ? 'ão' : 'ões'} criada${criadas === 1 ? '' : 's'} para ${MESES_PT[mesAtual - 1]}!`)
    setGerando(false)
  }

  const ativas = recorrentes.filter(r => r.ativa)
  const inativas = recorrentes.filter(r => !r.ativa)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Transações Recorrentes</h1>
        <div className="flex gap-2">
          <button onClick={gerarAgora} disabled={gerando || ativas.length === 0}
            className="btn-primary flex items-center gap-2">
            <Play className="w-4 h-4" />
            {gerando ? 'Gerando...' : 'Gerar mês atual'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-outline">
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm rounded-xl p-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {msg}
        </div>
      )}

      {recorrentes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="metric-card metric-card-receita">
            <div className="flex items-center gap-2 text-accent-blue mb-1.5">
              <Repeat className="w-4 h-4" />
              <span className="metric-label">Ativas</span>
            </div>
            <p className="metric-value text-accent-blue">{ativas.length}</p>
          </div>
          <div className="metric-card metric-card-despesa">
            <div className="flex items-center gap-2 text-accent-pink mb-1.5">
              <Repeat className="w-4 h-4" />
              <span className="metric-label">Total mensal</span>
            </div>
            <p className="metric-value text-accent-pink">
              {formatar(ativas.reduce((s, r) => s + (r.tipo === 'despesa' ? Number(r.valor) : 0), 0))}
            </p>
          </div>
          <div className="metric-card metric-card-saldo">
            <div className="flex items-center gap-2 text-accent-purple mb-1.5">
              <Repeat className="w-4 h-4" />
              <span className="metric-label">Receitas mensais</span>
            </div>
            <p className="metric-value text-accent-purple">
              {formatar(ativas.reduce((s, r) => s + (r.tipo === 'receita' ? Number(r.valor) : 0), 0))}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Nova Transação Recorrente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="text" required placeholder="Descrição"
              className="input-glass" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input type="number" required min="0.01" step="0.01" placeholder="Valor"
              className="input-glass" value={valor} onChange={e => setValor(e.target.value)} />
            <select className="select-glass" value={tipo} onChange={e => setTipo(e.target.value as 'receita' | 'despesa')}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <select className="select-glass" value={categoria} onChange={e => setCategoria(e.target.value)}>
              {(tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div>
              <span className="text-xs text-white/30">Dia vencimento</span>
              <input type="number" min="1" max="31" required className="input-glass mt-1"
                value={dia} onChange={e => setDia(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {recorrentes.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Repeat className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Nenhuma transação recorrente cadastrada.</p>
            <p className="text-white/20 text-xs mt-1">Adicione assinaturas, aluguel, salário e gere todo mês com 1 clique.</p>
          </div>
        )}

        {ativas.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white/70">Ativas ({ativas.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ativas.map(r => (
                <div key={r.id} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{r.descricao}</p>
                      <p className="text-xs text-white/30">Dia {r.dia_vencimento} • {r.categoria}</p>
                    </div>
                    <p className={`text-lg font-bold shrink-0 ${r.tipo === 'despesa' ? 'text-accent-pink' : 'text-accent-blue'}`}>
                      {r.tipo === 'despesa' ? '-' : '+'}{formatar(Number(r.valor))}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toggleAtiva(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-300 transition-all">
                      <Pause className="w-3.5 h-3.5" /> Pausar
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-pink/20 hover:text-accent-pink transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {inativas.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white/70">Pausadas ({inativas.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inativas.map(r => (
                <div key={r.id} className="glass-card p-4 opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{r.descricao}</p>
                      <p className="text-xs text-white/30">Dia {r.dia_vencimento} • {r.categoria}</p>
                    </div>
                    <p className="text-lg font-bold text-white/40 shrink-0">{formatar(Number(r.valor))}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toggleAtiva(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-accent-blue/70 hover:bg-accent-blue/20 hover:text-accent-blue transition-all">
                      <Play className="w-3.5 h-3.5" /> Reativar
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/50 hover:bg-accent-pink/20 hover:text-accent-pink transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
