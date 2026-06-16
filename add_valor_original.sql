-- Adicionar coluna valor_original na tabela dividas
ALTER TABLE dividas ADD COLUMN IF NOT EXISTS valor_original DECIMAL(12,2);
