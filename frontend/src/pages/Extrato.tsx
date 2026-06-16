import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transacao } from '../types'
import { MESES_PT, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../types'
import { Filter, Search, Upload, CheckCircle, AlertCircle, Trash2, ArrowRight, Download } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface LinhaPreview {
  data: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
}

export default function Extrato() {
  const [todas, setTodas] = useState<Transacao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos')
  const [filtroAno, setFiltroAno] = useState<number | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCat, setFiltroCat] = useState<string>('todas')
  const [showImport, setShowImport] = useState(false)
  const [linhas, setLinhas] = useState<LinhaPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)

  useEffect(() => {
    supabase.from('transacoes').select('*')
      .order('data_transacao', { ascending: false })
      .then(({ data }) => setTodas(data || []))
  }, [])

  function detectarColunas(headers: string[]) {
    const h = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    return {
      dataIdx: h.findIndex(h => /data|date|dt/.test(h)),
      descIdx: h.findIndex(h => /descricao|descri|desc|historico|hist|nome|titulo|label/.test(h)),
      valIdx: h.findIndex(h => /valor|value|val|quantia|amount|montante/.test(h)),
      tipoIdx: h.findIndex(h => /tipo|type|entrada|saida|credito|debito/.test(h)),
      catIdx: h.findIndex(h => /categoria|cat|category/.test(h)),
    }
  }

  function parseNumber(v: string) {
    const n = parseFloat(v.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.'))
    return isNaN(n) ? 0 : Math.abs(n)
  }

  function parseCSV(text: string): LinhaPreview[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''))
    const cols = detectarColunas(headers)
    const resultado: LinhaPreview[] = []

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''))
      if (vals.length < 3) continue

      let descricao = cols.descIdx >= 0 ? vals[cols.descIdx] : `Transação ${i}`
      let valor = parseNumber(cols.valIdx >= 0 ? vals[cols.valIdx] : '0')

      let data = cols.dataIdx >= 0 ? vals[cols.dataIdx] : new Date().toISOString().split('T')[0]
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        const [d, m, a] = data.split('/')
        data = `${a}-${m}-${d}`
      } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(data)) {
        const [d, m, a] = data.split('/')
        data = `20${a}-${m}-${d}`
      }

      let tipo: 'receita' | 'despesa' = 'despesa'
      if (cols.tipoIdx >= 0) {
        const t = vals[cols.tipoIdx].toLowerCase()
        if (/receita|credito|entrada|ganho|salario|renda/i.test(t)) tipo = 'receita'
      }
      if (cols.valIdx >= 0 && parseFloat(vals[cols.valIdx].replace(/[R$\s]/g, '').replace('.', '').replace(',', '.')) < 0) tipo = 'despesa'

      let categoria = 'Outros'
      if (cols.catIdx >= 0 && vals[cols.catIdx]) categoria = vals[cols.catIdx]
      else if (tipo === 'despesa') {
        const d = descricao.toLowerCase()
        if (/mercado|alimenta|comida|restaurante|lanche|ifood/i.test(d)) categoria = 'Alimentação'
        else if (/transporte|uber|gasolina|combustivel|onibus|metro|passagem/i.test(d)) categoria = 'Transporte'
        else if (/moradia|aluguel|condominio|iptu/i.test(d)) categoria = 'Moradia'
      }

      if (descricao && valor > 0) resultado.push({ data, descricao, valor, tipo, categoria })
    }
    return resultado
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErro('')
    setMsg('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) setErro('Nenhuma transação encontrada. Verifique se o CSV tem cabeçalho (data, descrição, valor).')
      setLinhas(parsed)
    }
    reader.readAsText(file)
  }

  function atualizarLinha(idx: number, campo: keyof LinhaPreview, valor: string | number) {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } as LinhaPreview : l))
  }

  async function importar() {
    setLoading(true); setErro(''); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Usuário não autenticado'); setLoading(false); return }

    let inseridas = 0
    for (const l of linhas) {
      const { error } = await supabase.from('transacoes').insert({
        usuario_id: user.id, descricao: l.descricao, valor: l.valor,
        tipo: l.tipo, categoria: l.categoria, data_transacao: l.data,
      })
      if (!error) inseridas++
    }
    setMsg(`${inseridas} transaç${inseridas === 1 ? 'ão' : 'ões'} importada${inseridas === 1 ? '' : 's'}!`)
    setLoading(false)
    if (inseridas === linhas.length) { setLinhas([]); setShowImport(false); carregar() }
  }

  async function carregar() {
    const { data } = await supabase.from('transacoes').select('*')
      .order('data_transacao', { ascending: false })
    setTodas(data || [])
  }

  let filtradas = [...todas]
  if (busca.trim()) filtradas = filtradas.filter(t => t.descricao.toLowerCase().includes(busca.toLowerCase()))
  if (filtroMes !== 'todos') filtradas = filtradas.filter(t => new Date(t.data_transacao).getMonth() + 1 === filtroMes)
  if (filtroAno !== 'todos') filtradas = filtradas.filter(t => new Date(t.data_transacao).getFullYear() === filtroAno)
  if (filtroTipo !== 'todos') filtradas = filtradas.filter(t => t.tipo.toLowerCase() === filtroTipo)
  if (filtroCat !== 'todas') filtradas = filtradas.filter(t => t.categoria === filtroCat)

  const total = filtradas.reduce((s, t) => s + Number(t.valor) * (t.tipo.toLowerCase() === 'receita' ? 1 : -1), 0)
  const qtdRec = filtradas.filter(t => t.tipo.toLowerCase() === 'receita').length
  const qtdDesp = filtradas.filter(t => t.tipo.toLowerCase() === 'despesa').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Extrato</h1>
        <div className="flex items-center gap-2">
          {todas.length > 0 && (
            <span className="text-xs text-white/30">{todas.length} transações</span>
          )}
          <button onClick={() => {
            const csv = [['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria']]
              .concat(filtradas.map(t => [t.data_transacao, t.descricao, String(t.valor), t.tipo, t.categoria]))
              .map(r => r.join(',')).join('\n')
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `pyfinancas-export-${new Date().toISOString().split('T')[0]}.csv`; a.click()
            URL.revokeObjectURL(url)
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80 transition-all">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              showImport
                ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue'
                : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}>
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
        </div>
      </div>

      {showImport && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white/70 text-sm">Importar Extrato Bancário</h3>
          <p className="text-xs text-white/30">Formato: CSV com colunas de data, descrição e valor. Compatível com Nubank e bancos tradicionais.</p>

          <label
            onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastando(false); const f = e.dataTransfer.files[0]; if (f) { const reader = new FileReader(); reader.onload = (ev) => { const text = ev.target?.result as string; setLinhas(parseCSV(text)) }; reader.readAsText(f) } }}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              arrastando ? 'border-accent-blue bg-accent-blue/10' : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}>
            <Upload className="w-6 h-6 text-white/30" />
            <span className="text-sm text-white/50">Clique ou arraste o CSV aqui</span>
            <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </label>

          {erro && (
            <div className="flex items-center gap-2 bg-accent-pink/15 border border-accent-pink/25 text-accent-pink text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
            </div>
          )}

          {msg && (
            <div className="flex items-center gap-2 bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm rounded-xl p-3">
              <CheckCircle className="w-4 h-4 shrink-0" /> {msg}
            </div>
          )}

          {linhas.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="text-left pb-2 font-medium">Data</th>
                      <th className="text-left pb-2 font-medium">Descrição</th>
                      <th className="text-right pb-2 font-medium">Valor</th>
                      <th className="text-center pb-2 font-medium">Tipo</th>
                      <th className="text-left pb-2 font-medium">Categoria</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-1.5 pr-2"><input type="date" className="input-glass !py-1 !px-2 !text-xs w-full min-w-[100px]" value={l.data} onChange={e => atualizarLinha(i, 'data', e.target.value)} /></td>
                        <td className="py-1.5 pr-2"><input className="input-glass !py-1 !px-2 !text-xs w-full min-w-[120px]" value={l.descricao} onChange={e => atualizarLinha(i, 'descricao', e.target.value)} /></td>
                        <td className="py-1.5 pr-2"><input type="number" step="0.01" className="input-glass !py-1 !px-2 !text-xs w-full min-w-[80px] text-right" value={l.valor} onChange={e => atualizarLinha(i, 'valor', parseFloat(e.target.value) || 0)} /></td>
                        <td className="py-1.5 pr-2 text-center">
                          <select className="select-glass !py-1 !px-2 !text-xs" value={l.tipo} onChange={e => atualizarLinha(i, 'tipo', e.target.value)}>
                            <option value="despesa">Despesa</option>
                            <option value="receita">Receita</option>
                          </select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <select className="select-glass !py-1 !px-2 !text-xs" value={l.categoria} onChange={e => atualizarLinha(i, 'categoria', e.target.value)}>
                            {(l.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="py-1.5">
                          <button onClick={() => setLinhas(prev => prev.filter((_, j) => j !== i))}
                            className="p-1 rounded-lg hover:bg-accent-pink/20 text-white/30 hover:text-accent-pink transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={importar} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Importando...' : <><ArrowRight className="w-4 h-4" /> Importar {linhas.length} transações</>}
              </button>
            </>
          )}
        </div>
      )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="select-glass">
            <option value="todas">Todas as categorias</option>
            {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card p-5">
        {filtradas.length > 0 ? (
          <div className="space-y-3">
            {filtradas.map(t => (
              <div key={t.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-white/40">{t.data_transacao}</span>
                      <span className={`badge ${t.tipo.toLowerCase() === 'receita' ? 'badge-receita' : 'badge-despesa'}`}>
                        {t.tipo.toLowerCase() === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                      <span className="text-xs text-white/30">{t.categoria}</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold shrink-0 -mt-0.5 ${
                    t.tipo.toLowerCase() === 'receita' ? 'text-accent-blue' : 'text-accent-pink'
                  }`}>
                    {t.tipo.toLowerCase() === 'receita' ? '+' : '-'}{formatar(Number(t.valor))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-8 h-8 mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">Nenhuma transação encontrada</p>
          </div>
        )}
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
            <span className={`font-bold text-lg ${total >= 0 ? 'text-accent-blue' : 'text-accent-pink'}`}>
              {formatar(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
