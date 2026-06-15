UPDATE transacoes SET tipo = 'receita' WHERE tipo = 'Receita';
UPDATE transacoes SET tipo = 'despesa' WHERE tipo = 'Despesa';

ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_tipo_check CHECK (tipo IN ('receita', 'despesa'));
