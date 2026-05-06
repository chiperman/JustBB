# Vercel 环境变量配置参考清单

本文档整理了 JustMemo 项目在 Vercel 上所需的完整环境变量配置。您可以参考此清单在 Vercel 控制台手动设置，或作为自动化配置的参考。

## 1. Production (生产环境)

**主要域名**: `https://just-memo.vercel.app`

| 变量名称                        | 建议值                                     | 说明                               | 状态 (线上) |
| :------------------------------ | :----------------------------------------- | :--------------------------------- | :---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://bgzqhhzddgqlrraqdfib.supabase.co` | Supabase 项目地址                  | ✅ 已存在   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...`                       | 公开 Anon Key                      | ✅ 已存在   |
| `SUPABASE_SERVICE_ROLE_KEY`     | `sb_secret_...`                            | **私密** Service Role Key (勿外泄) | ✅ 已存在   |
| `NEXT_PUBLIC_SITE_URL`          | `https://just-memo.vercel.app`             | 应用正式访问地址                   | ✅ 已存在   |
| `SUPABASE_PROJECT_REF`          | `bgzqhhzddgqlrraqdfib`                     | Supabase 项目标识符                | ❌ **缺失** |
| `SUPABASE_MANAGEMENT_API_KEY`   | `sbp_...`                                  | **私密** 管理 API Key (用于脚本)   | ❌ **缺失** |

---

## 2. Preview (预览环境)

**主要域名**: `https://just-memo-dev.vercel.app`

| 变量名称                        | 建议值                                     | 说明                               | 状态 (线上) |
| :------------------------------ | :----------------------------------------- | :--------------------------------- | :---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://bgzqhhzddgqlrraqdfib.supabase.co` | Supabase 项目地址 (与生产环境共用) | ❌ **缺失** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...`                       | 公开 Anon Key                      | ✅ 已存在   |
| `SUPABASE_SERVICE_ROLE_KEY`     | `sb_secret_...`                            | **私密** Service Role Key          | ✅ 已存在   |
| `NEXT_PUBLIC_SITE_URL`          | `https://just-memo-dev.vercel.app`         | 预览版访问地址                     | ❌ **缺失** |
| `SUPABASE_PROJECT_REF`          | `bgzqhhzddgqlrraqdfib`                     | Supabase 项目标识符                | ❌ **缺失** |
| `SUPABASE_MANAGEMENT_API_KEY`   | `sbp_...`                                  | **私密** 管理 API Key              | ❌ **缺失** |

---

## 设置说明

1. **敏感信息**: 带有 `SUPABASE_SERVICE_ROLE_KEY` 和 `SUPABASE_MANAGEMENT_API_KEY` 的变量在设置时请勾选 Vercel 的 "Sensitive Value" 选项。
2. **预览版域名**: 建议将 `NEXT_PUBLIC_SITE_URL` 设置为您的主预览域名 (`just-memo-dev.vercel.app`)，这样所有的 PR 预览都会使用这个统一的重定向地址，方便调试 OAuth。
3. **设置位置**: Vercel Dashboard -> Project Settings -> Environment Variables。
