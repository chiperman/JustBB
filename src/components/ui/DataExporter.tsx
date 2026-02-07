'use client';

import { useState } from 'react';
import { exportAllMemos } from '@/actions/export';
import { FileDown, FileJson, Loader2 } from 'lucide-react';
import { Memo } from '@/types/memo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function DataExporter() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            setLoading(true);
            const { data, error } = await exportAllMemos();

            if (error || !data) {
                toast({
                    title: "导出失败",
                    description: error || "未获取到数据",
                    variant: "destructive"
                });
                return;
            }

            let blob: Blob;
            let filename = `JustBB-Backup-${new Date().toISOString().slice(0, 10)}`;

            if (format === 'json') {
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename += '.json';
            } else {
                // Generate CSV
                try {
                    // Simple CSV conversion
                    const headers: (keyof Memo)[] = ['id', 'memo_number', 'content', 'created_at', 'tags', 'is_private', 'deleted_at'];
                    const csvContent = [
                        headers.join(','),
                        ...data.map((item: Memo) => {
                            return headers.map(key => {
                                let val = item[key];
                                if (Array.isArray(val)) val = val.join(';');
                                if (typeof val === 'string') {
                                    // Escape quotes and newlines
                                    val = `"${val.replace(/"/g, '""')}"`;
                                }
                                return val ?? '';
                            }).join(',');
                        })
                    ].join('\n');

                    // Add BOM for Excel compatibility
                    blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    filename += '.csv';
                } catch (e) {
                    console.error('CSV Generation Error', e);
                    toast({
                        title: "导出失败",
                        description: "生成 CSV 时发生错误",
                        variant: "destructive"
                    });
                    return;
                }
            }

            // Trigger Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "导出成功",
                description: `已生成 ${filename}`,
                variant: "success"
            });
        } catch (e) {
            console.error(e);
            toast({
                title: "导出错误",
                description: "系统内部错误",
                variant: "destructive"
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
                    className="flex items-center gap-2"
                    aria-label="导出完整数据为 JSON 格式"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileJson className="w-4 h-4" aria-hidden="true" />}
                    导出 JSON (完整)
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                    className="flex items-center gap-2"
                    aria-label="导出数据为 CSV 格式"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileDown className="w-4 h-4" aria-hidden="true" />}
                    导出 CSV
                </Button>
            </div>
        </section>
    );
}
