-- 20260620003000_grant_r2_configs_permissions.sql
-- 授予所有角色对 r2_configs 表的访问权限，解决前端调用时的 permission denied 报错
GRANT ALL ON TABLE public.r2_configs TO postgres, anon, authenticated, service_role;
