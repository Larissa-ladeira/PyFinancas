-- Adicionar colunas de salário real, vale alimentação e refeição na tabela configuracoes
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS salario_real DECIMAL(12,2) DEFAULT 0;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS vale_alimentacao DECIMAL(12,2) DEFAULT 0;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS refeicao DECIMAL(12,2) DEFAULT 0;
