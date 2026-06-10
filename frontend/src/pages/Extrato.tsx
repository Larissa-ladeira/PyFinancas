import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { MESES_PT, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../types'
import { Filter, Search } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Extrato() {
  const [todas, setTodas] = useState<Transacao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos')
  const [filtroAno, setFiltroAno] = useState<number | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCat, setFiltroCat] = useState<string>('todas')

  useEffect(() => {
    supabase.from('transacoes').select('*')
      .order('data_transacao', { ascending: false })
      .then(({ data }) => setTodas(data || []))
  }, [])

  let filtradas = [...todas]
  if (busca.trim()) filtradas = filtradas.filter(t =>
    t.descricao.toLowerCase().includes(busca.toLowerCase())
  )
  if (filtroMes !== 'todos') filtradas = filtradas.filter(t => new Date(t.data_transacao).getMonth() + 1 === filtroMes)
  if (filtroAno !== 'todos') filtradas = filtradas.filter(t => new Date(t.data_transacao).getFullYear() === filtroAno)
  if (filtroTipo !== 'todos') filtradas = filtradas.filter(t => t.tipo === filtroTipo)
  if (filtroCat !== 'todas') filtradas = filtradas.filter(t => t.categoria === filtroCat)

  const total = filtradas.reduce((s, t) => s + Number(t.valor) * (t.tipo === 'Receita' ? 1 : -1), 0)
  const qtdRec = filtradas.filter(t => t.tipo === 'Receita').length
  const qtdDesp = filtradas.filter(t => t.tipo === 'Despesa').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Extrato</h1>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filtros</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" placeholder="Buscar por descrição..."
                className="input-glass pl-9" value={busca}
                onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={String(filtroMes)} onChange={e => setFiltroMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))} className="select-glass">
            <option value="todos">Todos os meses</option>
            {MESES_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={String(filtroAno)} onChange={e => setFiltroAno(e.target.value === 'todos' ? 'todos' : Number(e.target.value))} className="select-glass">
            <option value="todos">Todos os anos</option>
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="select-glass">
            <option value="todos">Todos os tipos</option>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="select-glass">
            <option value="todas">Todas as categorias</option>
            {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          {filtradas.length > 0 ? (
            <table className="table-glass">
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                {filtradas.map(t => (
                  <tr key={t.id}>
                    <td className="text-white/40 whitespace-nowrap">{t.data_transacao}</td>
                    <td className="text-white/80 font-medium">{t.descricao}</td>
                    <td className="text-white/50">{t.categoria}</td>
                    <td>
                      <span className={`badge ${t.tipo === 'Receita' ? 'badge-receita' : 'badge-despesa'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className={`text-right font-semibold whitespace-nowrap
                      ${t.tipo === 'Receita' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {t.tipo === 'Receita' ? '+' : '-'}{formatar(Number(t.valor))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Search className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/30 text-sm">Nenhuma transação encontrada</p>
            </div>
          )}
        </div>
      </div>

      {filtradas.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex gap-4 text-white/30">
            <span>📈 {qtdRec} receitas</span>
            <span>📉 {qtdDesp} despesas</span>
            <span>📄 {filtradas.length} transações</span>
          </div>
          <div className="text-right">
            <span className="text-white/40">Saldo: </span>
            <span className={`font-bold text-lg ${total >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatar(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
