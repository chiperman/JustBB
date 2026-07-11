-- CLI 设备授权会话。
-- 只允许服务端 service_role 访问，浏览器和普通 Supabase 客户端不能直接读取。
CREATE TABLE IF NOT EXISTS public.cli_device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'consumed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_token TEXT,
  refresh_token TEXT,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cli_device_sessions_code_hash_idx
  ON public.cli_device_sessions (code_hash);

ALTER TABLE public.cli_device_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cli_device_sessions FROM anon, authenticated;
GRANT ALL ON TABLE public.cli_device_sessions TO service_role;
