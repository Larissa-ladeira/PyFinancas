-- ============================================================
-- Novas tabelas: Investimentos e Contas
-- ============================================================

-- Tabela de investimentos
CREATE TABLE IF NOT EXISTS investimentos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('acao', 'fii', 'crypto', 'cdb', 'renda_fixa', 'poupanca', 'outros')),
  valor_investido DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_atual DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantidade DECIMAL(12,4),
  data_aquisicao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investimentos_select ON investimentos;
CREATE POLICY investimentos_select ON investimentos
  FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS investimentos_insert ON investimentos;
CREATE POLICY investimentos_insert ON investimentos
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS investimentos_update ON investimentos;
CREATE POLICY investimentos_update ON investimentos
  FOR UPDATE USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS investimentos_delete ON investimentos;
CREATE POLICY investimentos_delete ON investimentos
  FOR DELETE USING (usuario_id = auth.uid());

-- Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS contas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'outros')),
  saldo DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contas_select ON contas;
CREATE POLICY contas_select ON contas
  FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS contas_insert ON contas;
CREATE POLICY contas_insert ON contas
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS contas_update ON contas;
CREATE POLICY contas_update ON contas
  FOR UPDATE USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS contas_delete ON contas;
CREATE POLICY contas_delete ON contas
  FOR DELETE USING (usuario_id = auth.uid());
