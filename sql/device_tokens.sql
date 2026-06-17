CREATE TABLE IF NOT EXISTS device_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas seus tokens" ON device_tokens;
DROP POLICY IF EXISTS "Usuários inserem apenas seus tokens" ON device_tokens;
DROP POLICY IF EXISTS "Usuários deletam apenas seus tokens" ON device_tokens;

CREATE POLICY "Usuários veem apenas seus tokens" ON device_tokens
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários inserem apenas seus tokens" ON device_tokens
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários deletam apenas seus tokens" ON device_tokens
  FOR DELETE USING (auth.uid() = usuario_id);
