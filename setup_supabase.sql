-- 1. Adicionar coluna de categoria
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS categoria TEXT;

-- 2. Ativar RLS nas tabelas (se ainda não estiver)
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para transacoes
CREATE POLICY "Usuários veem apenas suas transações"
  ON transacoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas suas transações"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas suas transações"
  ON transacoes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas suas transações"
  ON transacoes FOR DELETE
  USING (auth.uid() = usuario_id);

-- 4. Políticas para configuracoes
CREATE POLICY "Usuários veem apenas suas configurações"
  ON configuracoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas suas configurações"
  ON configuracoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas suas configurações"
  ON configuracoes FOR UPDATE
  USING (auth.uid() = usuario_id);

-- 5. Tabela de lembretes (contas a pagar)
CREATE TABLE IF NOT EXISTS lembretes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus lembretes"
  ON lembretes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas seus lembretes"
  ON lembretes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas seus lembretes"
  ON lembretes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas seus lembretes"
  ON lembretes FOR DELETE
  USING (auth.uid() = usuario_id);

-- 6. Tabela de dívidas (desfudencia)
CREATE TABLE IF NOT EXISTS dividas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  descricao TEXT NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  valor_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
  taxa_juros DECIMAL(5,2) NOT NULL DEFAULT 0,
  pagamento_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
  data_vencimento DATE,
  quitada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dividas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas dívidas"
  ON dividas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas suas dívidas"
  ON dividas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas suas dívidas"
  ON dividas FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas suas dívidas"
  ON dividas FOR DELETE
  USING (auth.uid() = usuario_id);

-- 7. Tabela de notificações por email
CREATE TABLE IF NOT EXISTS notificacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  ativo BOOLEAN NOT NULL DEFAULT false,
  email_notificacao TEXT,
  dias_antes INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas suas notificações"
  ON notificacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários atualizam apenas suas notificações"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas suas notificações"
  ON notificacoes FOR DELETE
  USING (auth.uid() = usuario_id);
