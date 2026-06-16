-- Script seguro para re-executar (drop policies first, then recreate)

-- 1. Coluna de categoria
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS categoria TEXT;

-- 2. RLS
ALTER TABLE IF EXISTS transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracoes ENABLE ROW LEVEL SECURITY;

-- 3. Drop policies existentes antes de recriar
DROP POLICY IF EXISTS "Usuários veem apenas suas transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários inserem apenas suas transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários deletam apenas suas transações" ON transacoes;

DROP POLICY IF EXISTS "Usuários veem apenas suas configurações" ON configuracoes;
DROP POLICY IF EXISTS "Usuários inserem apenas suas configurações" ON configuracoes;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas configurações" ON configuracoes;

-- 4. Recriar policies para transacoes
CREATE POLICY "Usuários veem apenas suas transações" ON transacoes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas suas transações" ON transacoes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas suas transações" ON transacoes FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas suas transações" ON transacoes FOR DELETE USING (auth.uid() = usuario_id);

-- 5. Recriar policies para configuracoes
CREATE POLICY "Usuários veem apenas suas configurações" ON configuracoes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas suas configurações" ON configuracoes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas suas configurações" ON configuracoes FOR UPDATE USING (auth.uid() = usuario_id);

-- 6. Tabela de lembretes
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
DROP POLICY IF EXISTS "Usuários veem apenas seus lembretes" ON lembretes;
DROP POLICY IF EXISTS "Usuários inserem apenas seus lembretes" ON lembretes;
DROP POLICY IF EXISTS "Usuários atualizam apenas seus lembretes" ON lembretes;
DROP POLICY IF EXISTS "Usuários deletam apenas seus lembretes" ON lembretes;
CREATE POLICY "Usuários veem apenas seus lembretes" ON lembretes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas seus lembretes" ON lembretes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas seus lembretes" ON lembretes FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas seus lembretes" ON lembretes FOR DELETE USING (auth.uid() = usuario_id);

-- 7. Tabela de dívidas
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
DROP POLICY IF EXISTS "Usuários veem apenas suas dívidas" ON dividas;
DROP POLICY IF EXISTS "Usuários inserem apenas suas dívidas" ON dividas;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas dívidas" ON dividas;
DROP POLICY IF EXISTS "Usuários deletam apenas suas dívidas" ON dividas;
CREATE POLICY "Usuários veem apenas suas dívidas" ON dividas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas suas dívidas" ON dividas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas suas dívidas" ON dividas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas suas dívidas" ON dividas FOR DELETE USING (auth.uid() = usuario_id);

-- 8. Tabela de notificações
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
DROP POLICY IF EXISTS "Usuários veem apenas suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários inserem apenas suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários atualizam apenas suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários deletam apenas suas notificações" ON notificacoes;
CREATE POLICY "Usuários veem apenas suas notificações" ON notificacoes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas suas notificações" ON notificacoes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas suas notificações" ON notificacoes FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas suas notificações" ON notificacoes FOR DELETE USING (auth.uid() = usuario_id);

-- 9. Tabela de acordos
CREATE TABLE IF NOT EXISTS acordos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  credor TEXT NOT NULL,
  descricao TEXT,
  valor_total DECIMAL(12,2) NOT NULL,
  valor_parcela DECIMAL(12,2) NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  data_inicio DATE,
  quitada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE acordos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem apenas seus acordos" ON acordos;
DROP POLICY IF EXISTS "Usuários inserem apenas seus acordos" ON acordos;
DROP POLICY IF EXISTS "Usuários atualizam apenas seus acordos" ON acordos;
DROP POLICY IF EXISTS "Usuários deletam apenas seus acordos" ON acordos;
CREATE POLICY "Usuários veem apenas seus acordos" ON acordos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários inserem apenas seus acordos" ON acordos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuários atualizam apenas seus acordos" ON acordos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários deletam apenas seus acordos" ON acordos FOR DELETE USING (auth.uid() = usuario_id);
