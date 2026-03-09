'use client';

import { useState } from 'react';
import { exportMemos } from '@/actions/memos/analytics';
import { HugeiconsIcon } from '@hugeicons/react';
import { FileDownloadIcon as FileDown, File02Icon as FileJson, Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function DataExporter() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleExport = async (format: 'markdown' | 'json') => {
        try {
            setLoading(true);
            const data = await exportMemos(format);

            if (!data) {
                toast({
                    title: "导出失败",
                    description: "没有可导出的数据",
                    variant: "destructive",
                });
                return;
            }

            const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memos-export-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'md'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "导出成功",
                description: `数据已导出为 ${format.toUpperCase()} 格式`,
            });
        } catch (err) {
            console.error('[Export] Failed:', err);
            toast({
                title: "操作失败",
                description: "导出过程中发生错误",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">数据管理</h3>
            <p className="text-sm text-muted-foreground mb-4">
                将所有数据导出为本地文件进行备份。
            </p>
            <div className="flex gap-4">
                <Button
                    onClick={() => handleExport('json')}
                    disabled={loading}
                    className="flex items-center gap-2 active:scale-95 transition-all"
                    aria-label="导出完整数据为 JSON 格式"
                >
                    {loading ? <HugeiconsIcon icon={Loader2} size={16} className="animate-spin" aria-hidden="true" /> : <HugeiconsIcon icon={FileJson} size={16} aria-hidden="true" />}
                    导出 JSON
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleExport('markdown')}
                    disabled={loading}
                    className="flex items-center gap-2 active:scale-95 transition-all"
                    aria-label="导出数据为 Markdown 格式"
                >
                    {loading ? <HugeiconsIcon icon={Loader2} size={16} className="animate-spin" aria-hidden="true" /> : <HugeiconsIcon icon={FileDown} size={16} aria-hidden="true" />}
                    导出 Markdown
                </Button>
            </div>
        </section>
    );
}
