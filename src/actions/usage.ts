"use server";

import { getSupabaseAdmin } from "@/lib/supabase";

const DB_LIMIT = 500 * 1024 * 1024; // 500MB (Bytes)
const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1GB (Bytes)
const MAU_LIMIT = 50000;
const EGRESS_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB (Bytes)

const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024));
const bytesToGB = (bytes: number) => Number((bytes / (1024 * 1024 * 1024)).toFixed(2));

export async function getSupabaseUsageStats() {
    const projectRef = process.env.SUPABASE_PROJECT_REF;
    const managementApiKey = process.env.SUPABASE_MANAGEMENT_API_KEY;

    // 优先尝试使用 Management API (全指标模式)
    if (projectRef && managementApiKey) {
        try {
            const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/usage`, {
                headers: {
                    Authorization: `Bearer ${managementApiKey}`,
                },
                next: { revalidate: 0 } // 禁用缓存，确保实时性
            });

            if (response.ok) {
                const usage = await response.json();

                const dbUsed = usage.db_size?.usage || 0;
                const storageUsed = usage.storage_size?.usage || 0;
                const mauUsed = usage.monthly_active_users?.usage || 0;
                const egressUsed = (usage.db_egress?.usage || 0) + (usage.storage_egress?.usage || 0);

                return {
                    success: true,
                    isFullIndicator: true,
                    data: {
                        db: {
                            used: bytesToMB(dbUsed),
                            limit: 500,
                            percentage: Math.min(Math.round((dbUsed / DB_LIMIT) * 100), 100),
                            unit: 'MB'
                        },
                        storage: {
                            used: bytesToMB(storageUsed),
                            limit: 1024,
                            percentage: Math.min(Math.round((storageUsed / STORAGE_LIMIT) * 100), 100),
                            unit: 'MB'
                        },
                        mau: {
                            used: mauUsed,
                            limit: 50000,
                            percentage: Math.min(Math.round((mauUsed / MAU_LIMIT) * 100), 100)
                        },
                        egress: {
                            used: bytesToGB(egressUsed),
                            limit: 2,
                            percentage: Math.min(Math.round((egressUsed / EGRESS_LIMIT) * 100), 100),
                            unit: 'GB'
                        },
                        realtime: {
                            connections: usage.realtime_peak_connections?.usage || 0,
                            messages: usage.realtime_message_count?.usage || 0
                        },
                        functions: {
                            invocations: usage.func_invocations?.usage || 0
                        }
                    }
                };
            } else {
                return {
                    success: false,
                    isFullIndicator: false,
                    error: `Supabase Management API failed: ${response.status}`
                };
            }
        } catch (error: any) {
            return {
                success: false,
                isFullIndicator: false,
                error: `Supabase Management API error: ${error.message}`
            };
        }
    }

    // 回退到 SQL 模式 (基础版)
    try {
        const supabase = getSupabaseAdmin();

        // 1. 获取用户数 (使用 auth.users 视图，需要 Admin 权限)
        const { count: userCount, error: userError } = await (supabase as any)
            .from('auth.users')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // 2. 获取数据库大小 (需要预先在 Supabase 中定义 get_database_size RPC)
        const { data: dbBytesData, error: dbError } = await (supabase as any).rpc('get_database_size');

        // 如果没有定义 RPC，默认返回一个基础值或通过日志提示
        const dbBytes = typeof dbBytesData === 'number' ? dbBytesData : 0;
        if (dbError) {
            console.warn('Fallback RPC get_database_size not found, skipping db size in fallback mode.');
        }

        return {
            success: true,
            isFullIndicator: false,
            data: {
                db: {
                    used: bytesToMB(dbBytes),
                    limit: 500,
                    percentage: Math.min(Math.round((dbBytes / DB_LIMIT) * 100), 100),
                    unit: 'MB'
                },
                mau: {
                    used: userCount || 0,
                    limit: 50000,
                    percentage: Math.min(Math.round(((userCount || 0) / MAU_LIMIT) * 100), 100)
                },
                // 基础版无法获取 Egress 和 Storage 实时配额，返回 0
                storage: { used: 0, limit: 1024, percentage: 0, unit: 'MB' },
                egress: { used: 0, limit: 2, percentage: 0, unit: 'GB' },
                realtime: { connections: 0, messages: 0 },
                functions: { invocations: 0 }
            }
        };
    } catch (error: any) {
        return {
            success: false,
            isFullIndicator: false,
            error: `Fallback mode failed: ${error.message}`
        };
    }
}
