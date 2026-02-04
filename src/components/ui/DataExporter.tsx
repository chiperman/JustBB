'use client';

import { useState } from 'react';
import { exportAllMemos } from '@/actions/export';
import { FileDown, FileJson, Loader2 } from 'lucide-react';
import { Memo } from '@/types/memo';

export function DataExporter() {
    const [loading, setLoading] = useState(false);

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            setLoading(true);
            const { data, error } = await exportAllMemos();

            if (error || !data) {
                alert('Export failed: ' + (error || 'No data'));
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
                    alert('CSV Generation Error');
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
        } catch (e) {
            console.error(e);
            alert('Export Error');
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
                <button
                    onClick={() => handleExport('json')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
                    导出 JSON (完整)
                </button>
                <button
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    导出 CSV
                </button>
            </div>
        </section>
    );
}
