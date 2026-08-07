-- Marcar despesas como pagas (pago) em vez de excluir ao clicar em Pagar
-- RODAR NO SQL EDITOR DO SUPABASE (projeto cjnxfpkmibkyezulwtrt)
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT false;
