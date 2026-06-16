export interface Transacao {
  id: number
  usuario_id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data_transacao: string
}

export interface Configuracao {
  id: number
  usuario_id: string
  salario_base: number
}

export interface Lembrete {
  id: number
  usuario_id: string
  descricao: string
  valor: number
  data_vencimento: string
  pago: boolean
  created_at: string
}

export interface Notificacao {
  id: number
  usuario_id: string
  ativo: boolean
  email_notificacao: string | null
  dias_antes: number
  created_at: string
  updated_at: string
}

export interface Divida {
  id: number
  usuario_id: string
  descricao: string
  valor_total: number
  valor_original: number | null
  valor_pago: number
  taxa_juros: number
  pagamento_minimo: number
  data_vencimento: string | null
  quitada: boolean
  created_at: string
}

export interface TransacaoForm {
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data_transacao: string
}

export interface Acordo {
  id: number
  usuario_id: string
  credor: string
  descricao: string | null
  valor_total: number
  valor_parcela: number
  parcelas: number
  parcelas_pagas: number
  data_inicio: string | null
  quitada: boolean
  created_at: string
}

export interface MetaEconomia {
  id: number
  usuario_id: string
  descricao: string
  valor_alvo: number
  valor_atual: number
  data_alvo: string | null
  concluida: boolean
  created_at: string
}

export interface MetaOrcamento {
  id: number
  usuario_id: string
  categoria: string
  valor_limite: number
  mes: number
  ano: number
}

export interface TransacaoRecorrente {
  id: number
  usuario_id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  dia_vencimento: number
  ativa: boolean
  data_inicio: string
  created_at: string
}

export interface Investimento {
  id: number
  usuario_id: string
  descricao: string
  tipo: 'acao' | 'fii' | 'crypto' | 'cdb' | 'renda_fixa' | 'poupanca' | 'outros'
  valor_investido: number
  valor_atual: number
  quantidade: number | null
  data_aquisicao: string | null
  created_at: string
}

export interface Conta {
  id: number
  usuario_id: string
  nome: string
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'outros'
  saldo: number
  created_at: string
}

export const CATEGORIAS_RECEITA = [
  'Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'
]

export const CATEGORIAS_DESPESA = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
  'Lazer', 'Assinaturas', 'Compras', 'Outros'
]

export const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const TIPOS_INVESTIMENTO = [
  { value: 'acao', label: 'Ações' },
  { value: 'fii', label: 'FIIs' },
  { value: 'crypto', label: 'Criptomoedas' },
  { value: 'cdb', label: 'CDB' },
  { value: 'renda_fixa', label: 'Renda Fixa' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'outros', label: 'Outros' },
]

export const TIPOS_CONTA = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'outros', label: 'Outros' },
]
