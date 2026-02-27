'use client';

import { DataExporter } from "@/components/ui/DataExporter";
import { UsageModal } from "@/components/admin/UsageModal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon, CheckListIcon } from "@hugeicons/core-free-icons";

export default function AdminPage() {
    return (
        <div className="space-y-10">
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">服务用量</h3>
                        <UsageModal
                            trigger={
                                <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 px-4">
                                    <HugeiconsIcon icon={CheckListIcon} size={14} />
                                    查看配额详情
                                </Button>
                            }
                        />
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <HugeiconsIcon icon={Database01Icon} size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Supabase 基础设施</p>
                                <p className="text-xs text-muted-foreground">实时监控数据库、存储与 API 资源使用情况。</p>
                            </div>
                        </div>
                    </div>
                </section>

                <DataExporter />
            </div>
        </div>
    );
}
