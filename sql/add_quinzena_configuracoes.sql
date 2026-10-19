-- Adicionar suporte a pagamento por quinzena na tabela configuracoes
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS pago_por_quinzena BOOLEAN NOT NULL DEFAULT false;
