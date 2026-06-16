import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../types'
import { Upload, CheckCircle, AlertCircle, Trash2, ArrowRight } from 'lucide-react'

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

export default function ImportarExtrato() {
  const [linhas, setLinhas] = useState<LinhaPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)

  function detectarColunas(headers: string[]): { dataIdx: number; descIdx: number; valIdx: number; tipoIdx: number; catIdx: number } {
    const h = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    const dataIdx = h.findIndex(h => /data|date|dt/.test(h))
    const descIdx = h.findIndex(h => /descricao|descri|desc|historico|hist|nome|titulo|label/.test(h))
    const valIdx = h.findIndex(h => /valor|value|val|quantia|amount|ammount|montante/.test(h))
    const tipoIdx = h.findIndex(h => /tipo|type|entrada|saida|credito|debito/.test(h))
    const catIdx = h.findIndex(h => /categoria|cat|category|categ/.test(h))
    return { dataIdx, descIdx, valIdx, tipoIdx, catIdx }
  }

  function parseNumber(v: string): number {
    const cleaned = v.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return isNaN(n) ? 0 : Math.abs(n)
  }

  function parseCSV(text: string): LinhaPreview[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []

    const separador = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(separador).map(h => h.trim().replace(/^["']|["']$/g, ''))
    const cols = detectarColunas(headers)

    const resultado: LinhaPreview[] = []
    const dataAtual = new Date()

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(separador).map(v => v.trim().replace(/^["']|["']$/g, ''))
      if (vals.length < 3) continue

      const descricao = cols.descIdx >= 0 ? vals[cols.descIdx] : `Transação ${i}`
      const valorRaw = cols.valIdx >= 0 ? vals[cols.valIdx] : '0'
      let valor = parseNumber(valorRaw)

      const dataRaw = cols.dataIdx >= 0 ? vals[cols.dataIdx] : dataAtual.toISOString().split('T')[0]
      let data = dataRaw
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataRaw)) {
        const [d, m, a] = dataRaw.split('/')
        data = `${a}-${m}-${d}`
      } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(dataRaw)) {
        const [d, m, a] = dataRaw.split('/')
        data = `20${a}-${m}-${d}`
      }

      let tipo: 'receita' | 'despesa' = 'despesa'
      if (cols.tipoIdx >= 0) {
        const t = vals[cols.tipoIdx].toLowerCase()
        if (/receita|credito|entrada|ganho|salario|renda|receitas/i.test(t)) tipo = 'receita'
        else if (/despesa|debito|saida|gasto|pagamento/i.test(t)) tipo = 'despesa'
      }
      if (valorRaw.startsWith('-') || valorRaw.startsWith('(')) tipo = 'despesa'
      if (cols.valIdx >= 0 && parseFloat(vals[cols.valIdx].replace(/[R$\s]/g, '').replace('.', '').replace(',', '.')) < 0) {
        tipo = 'despesa'
      }

      let categoria = 'Outros'
      if (cols.catIdx >= 0 && vals[cols.catIdx]) {
        categoria = vals[cols.catIdx]
      } else if (tipo === 'despesa') {
        const descLow = descricao.toLowerCase()
        if (/mercado|alimenta|comida|restaurante|lanche|ifood/i.test(descLow)) categoria = 'Alimentação'
        else if (/transporte|uber|gasolina|combustivel|onibus|metro|passagem/i.test(descLow)) categoria = 'Transporte'
        else if (/moradia|aluguel|condominio|iptu/i.test(descLow)) categoria = 'Moradia'
      }

      if (descricao && valor > 0) {
        resultado.push({ data, descricao, valor, tipo, categoria })
      }
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
      if (parsed.length === 0) {
        setErro('Nenhuma transação encontrada. Verifique se o CSV tem cabeçalho (data, descrição, valor).')
      }
      setLinhas(parsed)
    }
    reader.readAsText(file)
  }

  function atualizarLinha(idx: number, campo: keyof LinhaPreview, valor: string | number) {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } as LinhaPreview : l))
  }

  async function importar() {
    setLoading(true)
    setErro('')
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Usuário não autenticado'); setLoading(false); return }

    let inseridas = 0
    for (const l of linhas) {
      const { error } = await supabase.from('transacoes').insert({
        usuario_id: user.id,
        descricao: l.descricao,
        valor: l.valor,
        tipo: l.tipo,
        categoria: l.categoria,
        data_transacao: l.data,
      })
      if (!error) inseridas++
    }

    setMsg(`${inseridas} transaç${inseridas === 1 ? 'ão' : 'ões'} importada${inseridas === 1 ? '' : 's'} com sucesso!`)
    setLoading(false)
    if (inseridas === linhas.length) setLinhas([])
  }

  const totalImportar = linhas.reduce((s, l) => s + l.valor, 0)
  const qtdReceitas = linhas.filter(l => l.tipo === 'receita').length
  const qtdDespesas = linhas.filter(l => l.tipo === 'despesa').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="w-6 h-6 text-accent-blue" />
        <h1 className="text-2xl font-bold text-white">Importar Extrato</h1>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-2">Formato esperado (CSV)</h2>
        <p className="text-xs text-white/30 mb-4">
          O arquivo deve ter cabeçalho com colunas de data, descrição e valor.
          Compatível com Nubank, bancos tradicionais e planilhas.
        </p>
        <div className="bg-white/5 rounded-xl p-3 mb-4">
          <code className="text-xs text-white/40">
            data;descrição;valor;tipo;categoria{'\n'}
            01/01/2024;Salário;5000;receita;Salário{'\n'}
            05/01/2024;Mercado;-350;despesa;Alimentação
          </code>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); const f = e.dataTransfer.files[0]; if (f) { const reader = new FileReader(); reader.onload = (ev) => { const text = ev.target?.result as string; setLinhas(parseCSV(text)) }; reader.readAsText(f) } }}
          className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            arrastando ? 'border-accent-blue bg-accent-blue/10' : 'border-white/10 hover:border-white/20 bg-white/5'
          }`}>
          <Upload className="w-8 h-8 text-white/30" />
          <span className="text-sm text-white/50">Clique para selecionar ou arraste o CSV aqui</span>
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {erro && (
        <div className="flex items-center gap-2 bg-accent-pink/15 border border-accent-pink/25 text-accent-pink text-sm rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      {linhas.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="metric-card metric-card-receita">
              <span className="metric-label text-accent-blue">Total a importar</span>
              <p className="metric-value text-accent-blue">{formatar(totalImportar)}</p>
            </div>
            <div className="metric-card metric-card-despesa">
              <span className="metric-label text-accent-pink">Despesas</span>
              <p className="metric-value text-accent-pink">{qtdDespesas} transações</p>
            </div>
            <div className="metric-card metric-card-saldo">
              <span className="metric-label text-accent-purple">Receitas</span>
              <p className="metric-value text-accent-purple">{qtdReceitas} transações</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-white/70">
                Preview ({linhas.length} linhas)
              </h2>
              <span className="text-xs text-white/30">Clique nos campos para editar antes de importar</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left pb-2 font-medium">Data</th>
                    <th className="text-left pb-2 font-medium">Descrição</th>
                    <th className="text-right pb-2 font-medium">Valor</th>
                    <th className="text-center pb-2 font-medium">Tipo</th>
                    <th className="text-left pb-2 font-medium">Categoria</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-2">
                        <input type="date" className="input-glass !py-1 !px-2 !text-xs w-32" value={l.data}
                          onChange={e => atualizarLinha(i, 'data', e.target.value)} />
                      </td>
                      <td className="py-2 pr-2">
                        <input className="input-glass !py-1 !px-2 !text-xs w-40" value={l.descricao}
                          onChange={e => atualizarLinha(i, 'descricao', e.target.value)} />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" step="0.01" className="input-glass !py-1 !px-2 !text-xs w-24 text-right" value={l.valor}
                          onChange={e => atualizarLinha(i, 'valor', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-2 pr-2 text-center">
                        <select className="select-glass !py-1 !px-2 !text-xs" value={l.tipo}
                          onChange={e => atualizarLinha(i, 'tipo', e.target.value)}>
                          <option value="despesa">Despesa</option>
                          <option value="receita">Receita</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select className="select-glass !py-1 !px-2 !text-xs" value={l.categoria}
                          onChange={e => atualizarLinha(i, 'categoria', e.target.value)}>
                          {(l.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
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
            <button onClick={importar} disabled={loading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {loading ? 'Importando...' : <><ArrowRight className="w-4 h-4" /> Importar {linhas.length} transações</>}
            </button>
          </div>
        </>
      )}

      {msg && (
        <div className="flex items-center gap-2 bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm rounded-xl p-3">
          <CheckCircle className="w-4 h-4 shrink-0" /> {msg}
        </div>
      )}
    </div>
  )
}
