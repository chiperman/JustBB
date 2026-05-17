-- R2 配置表：每个用户自己的 Cloudflare R2 存储配置
CREATE TABLE IF NOT EXISTS public.r2_configs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    access_key_id TEXT NOT NULL,
    secret_access_key TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 更新时间触发器
CREATE TRIGGER handle_r2_configs_updated_at
    BEFORE UPDATE ON public.r2_configs
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- RLS：用户只能操作自己的配置
ALTER TABLE r2_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own r2 config"
ON r2_configs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own r2 config"
ON r2_configs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own r2 config"
ON r2_configs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own r2 config"
ON r2_configs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
