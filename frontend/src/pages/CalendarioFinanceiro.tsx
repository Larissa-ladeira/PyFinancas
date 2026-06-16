import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Lembrete, Divida, Acordo, TransacaoRecorrente } from '../types'
import { MESES_PT } from '../types'
import { CalendarDays, ChevronLeft, ChevronRight, Bell, PiggyBank, Handshake, Repeat } from 'lucide-react'

function formatar(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Evento {
  dia: number
  descricao: string
  valor: number
  tipo: 'lembrete' | 'divida' | 'acordo' | 'recorrente'
}

export default function CalendarioFinanceiro() {
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [dividas, setDividas] = useState<Divida[]>([])
  const [acordos, setAcordos] = useState<Acordo[]>([])
  const [recorrentes, setRecorrentes] = useState<TransacaoRecorrente[]>([])

  useEffect(() => {
    carregarLembretes()
    carregarDividas()
    carregarAcordos()
    carregarRecorrentes()
  }, [mes, ano])

  async function carregarLembretes() {
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = mes === 12
      ? new Date(ano + 1, 0, 1).toISOString().split('T')[0]
      : new Date(ano, mes, 1).toISOString().split('T')[0]
    const { data } = await supabase.from('lembretes').select('*')
      .gte('data_vencimento', inicio).lt('data_vencimento', fim)
    setLembretes(data || [])
  }

  async function carregarDividas() {
    const { data } = await supabase.from('dividas').select('*')
      .eq('quitada', false).not('data_vencimento', 'is', null)
    setDividas(data || [])
  }

  async function carregarAcordos() {
    const { data } = await supabase.from('acordos').select('*').eq('quitada', false)
    setAcordos(data || [])
  }

  async function carregarRecorrentes() {
    const { data } = await supabase.from('transacoes_recorrentes').select('*').eq('ativa', true)
    setRecorrentes(data || [])
  }

  const eventos = useMemo(() => {
    const lista: Evento[] = []

    lembretes.forEach(l => {
      const d = new Date(l.data_vencimento)
      if (d.getMonth() + 1 === mes && d.getFullYear() === ano) {
        lista.push({ dia: d.getDate(), descricao: l.descricao, valor: Number(l.valor), tipo: 'lembrete' })
      }
    })

    dividas.forEach(d => {
      if (!d.data_vencimento) return
      const dt = new Date(d.data_vencimento)
      if (dt.getMonth() + 1 === mes && dt.getFullYear() === ano) {
        const restante = Number(d.valor_total) - Number(d.valor_pago)
        lista.push({ dia: dt.getDate(), descricao: d.descricao, valor: restante, tipo: 'divida' })
      }
    })

    acordos.forEach(a => {
      const dt = a.data_inicio ? new Date(a.data_inicio) : null
      if (dt && dt.getMonth() + 1 === mes && dt.getFullYear() === ano) {
        const restante = Number(a.valor_parcela) * (Number(a.parcelas) - Number(a.parcelas_pagas))
        lista.push({ dia: dt.getDate(), descricao: `Acordo: ${a.credor}`, valor: restante, tipo: 'acordo' })
      }
    })

    recorrentes.forEach(r => {
      lista.push({ dia: r.dia_vencimento, descricao: r.descricao, valor: Number(r.valor), tipo: 'recorrente' })
    })

    return lista.sort((a, b) => a.dia - b.dia)
  }, [lembretes, dividas, acordos, recorrentes, mes, ano])

  const diasNoMes = new Date(ano, mes, 0).getDate()
  const primeiroDia = new Date(ano, mes - 1, 1).getDay()
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${hoje.getMonth() + 1}-${hoje.getDate()}`

  const totalMes = eventos.reduce((s, e) => s + e.valor, 0)

  const nav = (d: number) => {
    const nova = new Date(ano, mes - 1 + d, 1)
    setMes(nova.getMonth() + 1)
    setAno(nova.getFullYear())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Calendário Financeiro</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-white min-w-[160px] text-center">
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button onClick={() => nav(1)} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {totalMes > 0 && (
        <div className="metric-card metric-card-despesa">
          <div className="flex items-center gap-2 text-accent-pink mb-1.5">
            <CalendarDays className="w-4 h-4" />
            <span className="metric-label">Total de compromissos no mês</span>
          </div>
          <p className="metric-value text-accent-pink">{formatar(totalMes)}</p>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map(d => (
            <div key={d} className="text-center text-xs text-white/30 font-medium py-2">{d}</div>
          ))}
          {Array.from({ length: primeiroDia }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: diasNoMes }, (_, i) => {
            const dia = i + 1
            const eventosDia = eventos.filter(e => e.dia === dia)
            const isHoje = `${ano}-${mes}-${String(dia).padStart(2, '0')}` === hojeStr
            return (
              <div key={dia}
                className={`min-h-[90px] rounded-xl p-1.5 border transition-all ${
                  isHoje
                    ? 'border-accent-blue/50 bg-accent-blue/10'
                    : eventosDia.length > 0
                      ? 'border-white/10 bg-white/5'
                      : 'border-transparent'
                }`}>
                <span className={`text-xs font-medium ${isHoje ? 'text-accent-blue' : 'text-white/50'}`}>
                  {dia}
                </span>
                <div className="mt-1 space-y-1">
                  {eventosDia.slice(0, 3).map((ev, j) => {
                    const cores: Record<string, string> = {
                      lembrete: 'bg-accent-pink/20 text-accent-pink border-accent-pink/20',
                      divida: 'bg-accent-purple/20 text-accent-purple border-accent-purple/20',
                      acordo: 'bg-accent-blue/20 text-accent-blue border-accent-blue/20',
                      recorrente: 'bg-amber-500/15 text-amber-300 border-amber-500/15',
                    }
                    const icones: Record<string, any> = {
                      lembrete: Bell, divida: PiggyBank, acordo: Handshake, recorrente: Repeat,
                    }
                    const Icon = icones[ev.tipo]
                    return (
                      <div key={j}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${cores[ev.tipo]}`}>
                        <Icon className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{ev.descricao}</span>
                      </div>
                    )
                  })}
                  {eventosDia.length > 3 && (
                    <span className="text-[10px] text-white/30">+{eventosDia.length - 3} mais</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {eventos.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm text-white/70 mb-4">Todos os eventos do mês</h2>
          <div className="space-y-2">
            {eventos.map((ev, i) => {
              const labels: Record<string, string> = {
                lembrete: 'Lembrete', divida: 'Dívida', acordo: 'Acordo', recorrente: 'Recorrente',
              }
              const badgeColors: Record<string, string> = {
                lembrete: 'bg-accent-pink/20 text-accent-pink',
                divida: 'bg-accent-purple/20 text-accent-purple',
                acordo: 'bg-accent-blue/20 text-accent-blue',
                recorrente: 'bg-amber-500/15 text-amber-300',
              }
              return (
                <div key={i} className="flex items-center justify-between glass-card !p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white/30 min-w-[2rem]">{ev.dia}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{ev.descricao}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColors[ev.tipo]}`}>
                        {labels[ev.tipo]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white">{formatar(ev.valor)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {eventos.length === 0 && (
        <div className="glass-card p-8 text-center">
          <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Nenhum evento financeiro neste mês.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-pink/50" /> Lembretes</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-purple/50" /> Dívidas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-blue/50" /> Acordos</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" /> Recorrentes</span>
      </div>
    </div>
  )
}
