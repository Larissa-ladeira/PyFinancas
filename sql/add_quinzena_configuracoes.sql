-- Adicionar suporte a pagamento por quinzena na tabela configuracoes
-- 5o dia util = salario; dia 20 = adiantamento
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pago_por_quinzena BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS valor_quinzena_5_dia_util DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS valor_quinzena_dia_20 DECIMAL(12,2) NOT NULL DEFAULT 0;
