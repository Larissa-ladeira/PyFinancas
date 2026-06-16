import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Investimento } from '../types'
import { TIPOS_INVESTIMENTO } from '../types'
import { TrendingUp, Plus, Trash2, Pencil, BarChart3 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Investimentos() {
  const [items, setItems] = useState<Investimento[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('acao')
  const [valorInvestido, setValorInvestido] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [dataAquisicao, setDataAquisicao] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('investimentos').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  function resetForm() {
    setDescricao(''); setTipo('acao'); setValorInvestido(''); setValorAtual('')
    setQuantidade(''); setDataAquisicao(''); setEditId(null)
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !descricao || !valorInvestido) return

    const payload = {
      descricao, tipo, quantidade: quantidade ? Number(quantidade) : null,
      data_aquisicao: dataAquisicao || null,
      valor_investido: Number(valorInvestido),
      valor_atual: Number(valorAtual || valorInvestido),
    }

    if (editId) {
      await supabase.from('investimentos').update(payload).eq('id', editId)
    } else {
      await supabase.from('investimentos').insert({ ...payload, usuario_id: user.id })
    }

    resetForm(); setShowForm(false); carregar()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('investimentos').delete().eq('id', deleteId)
    setDeleteId(null); carregar()
  }

  function editItem(item: Investimento) {
    setDescricao(item.descricao); setTipo(item.tipo); setValorInvestido(String(item.valor_investido))
    setValorAtual(String(item.valor_atual)); setQuantidade(item.quantidade ? String(item.quantidade) : '')
    setDataAquisicao(item.data_aquisicao || ''); setEditId(item.id); setShowForm(true)
  }

  const totalInvestido = items.reduce((s, i) => s + Number(i.valor_investido), 0)
  const totalAtual = items.reduce((s, i) => s + Number(i.valor_atual), 0)
  const rendimento = totalAtual - totalInvestido
  const rendimentoPerc = totalInvestido > 0 ? (rendimento / totalInvestido) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Investimentos</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Investimento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card metric-card-receita">
          <div className="flex items-center gap-2 text-accent-blue mb-1.5">
            <TrendingUp className="w-4 h-4" />
            <span className="metric-label">Total Investido</span>
          </div>
          <p className="metric-value text-accent-blue">{formatar(totalInvestido)}</p>
        </div>
        <div className="metric-card metric-card-saldo">
          <div className="flex items-center gap-2 text-accent-purple mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="metric-label">Valor Atual</span>
          </div>
          <p className="metric-value text-accent-purple">{formatar(totalAtual)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1.5" style={{ color: rendimento >= 0 ? 'var(--accent-blue)' : 'var(--accent-pink)' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="metric-label">Rendimento</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: rendimento >= 0 ? 'var(--accent-blue)' : 'var(--accent-pink)' }}>
            {rendimento >= 0 ? '+' : ''}{formatar(rendimento)}
            <span className="text-sm ml-1">({rendimentoPerc >= 0 ? '+' : ''}{rendimentoPerc.toFixed(1)}%)</span>
          </p>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-white mb-4">{editId ? 'Editar' : 'Novo'} Investimento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)}
                className="input-glass" placeholder="Ex: PETR4" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="select-glass">
                {TIPOS_INVESTIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Valor Investido (R$)</label>
              <input type="number" step="0.01" value={valorInvestido} onChange={e => setValorInvestido(e.target.value)}
                className="input-glass" placeholder="1000,00" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Valor Atual (R$)</label>
              <input type="number" step="0.01" value={valorAtual} onChange={e => setValorAtual(e.target.value)}
                className="input-glass" placeholder="1200,00" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Quantidade</label>
              <input type="number" step="any" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                className="input-glass" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Data da Aquisição</label>
              <input type="date" value={dataAquisicao} onChange={e => setDataAquisicao(e.target.value)}
                className="input-glass" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setShowForm(false) }} className="btn-outline">Cancelar</button>
            <button onClick={handleSave} className="btn-primary">{editId ? 'Atualizar' : 'Adicionar'}</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhum investimento cadastrado"
          description="Adicione ações, FIIs, CDBs, criptomoedas ou outros ativos para acompanhar sua carteira completa."
          action={{ label: 'Adicionar Investimento', onClick: () => { resetForm(); setShowForm(true) } }}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Tipo</th>
                  <th>Investido</th>
                  <th>Atual</th>
                  <th>Rendimento</th>
                  <th>Qtd</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const rend = Number(item.valor_atual) - Number(item.valor_investido)
                  const rendP = Number(item.valor_investido) > 0 ? (rend / Number(item.valor_investido)) * 100 : 0
                  return (
                    <tr key={item.id}>
                      <td className="font-medium text-white">{item.descricao}</td>
                      <td><span className="badge badge-receita">{TIPOS_INVESTIMENTO.find(t => t.value === item.tipo)?.label || item.tipo}</span></td>
                      <td className="text-white/70">{formatar(Number(item.valor_investido))}</td>
                      <td className="text-white">{formatar(Number(item.valor_atual))}</td>
                      <td className={rend >= 0 ? 'text-accent-blue' : 'text-accent-pink'}>
                        {rend >= 0 ? '+' : ''}{formatar(rend)} ({rendP >= 0 ? '+' : ''}{rendP.toFixed(1)}%)
                      </td>
                      <td className="text-white/50">{item.quantidade ?? '-'}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => editItem(item)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-accent-blue transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-accent-pink transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Excluir investimento?"
        message="Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
