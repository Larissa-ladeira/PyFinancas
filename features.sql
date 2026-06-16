-- ============================================
-- Feature 1: Metas de Economia
-- ============================================
CREATE TABLE IF NOT EXISTS metas_economia (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  descricao TEXT NOT NULL,
  valor_alvo DECIMAL(12,2) NOT NULL,
  valor_atual DECIMAL(12,2) NOT NULL DEFAULT 0,
  data_alvo DATE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE metas_economia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem apenas suas metas" ON metas_economia;
DROP POLICY IF EXISTS "Usuários inserem apenas suas metas" ON metas_economia;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas metas" ON metas_economia;
DROP POLICY IF EXISTS "Usuários deletam apenas suas metas" ON metas_economia;
CREATE POLICY "Usuários veem apenas suas metas" ON metas_economia FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas suas metas" ON metas_economia FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas suas metas" ON metas_economia FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas suas metas" ON metas_economia FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- Feature 2: Metas de Orçamento por Categoria
-- ============================================
CREATE TABLE IF NOT EXISTS metas_orcamento (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  categoria TEXT NOT NULL,
  valor_limite DECIMAL(12,2) NOT NULL,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, categoria, mes, ano)
);
ALTER TABLE metas_orcamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem apenas seus orçamentos" ON metas_orcamento;
DROP POLICY IF EXISTS "Usuários inserem apenas seus orçamentos" ON metas_orcamento;
DROP POLICY IF EXISTS "Usuários atualizam apenas seus orçamentos" ON metas_orcamento;
DROP POLICY IF EXISTS "Usuários deletam apenas seus orçamentos" ON metas_orcamento;
CREATE POLICY "Usuários veem apenas seus orçamentos" ON metas_orcamento FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas seus orçamentos" ON metas_orcamento FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas seus orçamentos" ON metas_orcamento FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas seus orçamentos" ON metas_orcamento FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- Feature 3: Transações Recorrentes
-- ============================================
CREATE TABLE IF NOT EXISTS transacoes_recorrentes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  ativa BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE transacoes_recorrentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem apenas recorrentes" ON transacoes_recorrentes;
DROP POLICY IF EXISTS "Usuários inserem apenas recorrentes" ON transacoes_recorrentes;
DROP POLICY IF EXISTS "Usuários atualizam apenas recorrentes" ON transacoes_recorrentes;
DROP POLICY IF EXISTS "Usuários deletam apenas recorrentes" ON transacoes_recorrentes;
CREATE POLICY "Usuários veem apenas recorrentes" ON transacoes_recorrentes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas recorrentes" ON transacoes_recorrentes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas recorrentes" ON transacoes_recorrentes FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas recorrentes" ON transacoes_recorrentes FOR DELETE USING (auth.uid() = usuario_id);
