export interface Transacao {
  id: number
  usuario_id: string
  descricao: string
  valor: number
  tipo: 'Receita' | 'Despesa'
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

export interface Divida {
  id: number
  usuario_id: string
  descricao: string
  valor_total: number
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
  tipo: 'Receita' | 'Despesa'
  categoria: string
  data_transacao: string
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
