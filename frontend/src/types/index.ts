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
