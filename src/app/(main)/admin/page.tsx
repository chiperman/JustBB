'use client';

import { DataExporter } from "@/components/ui/DataExporter";

export default function AdminPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-10">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">系统配置</h2>
                <p className="text-muted-foreground mt-2">管理您的 JustMemo 偏好与安全设置。</p>
            </header>

            <div className="grid gap-6">
                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">身份认证</h3>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border border-dashed text-center">
                        <p className="text-sm text-muted-foreground">
                            环境变量已通过 .env.local 加载成功。
                        </p>
                    </div>
                </section>

                <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">关于项目</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            JustMemo 是一个专注于“碎片化人文记录”的私有笔记系统。
                        </p>
                        <p>
                            基于 Next.js 15, Tailwind CSS 与 Supabase 构建。采用了原子化提交与高度权限隔离的架构设计。
                        </p>
                    </div>
                </section>

                <DataExporter />
            </div>
        </div>
    );
}
