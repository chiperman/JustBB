'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTags } from '@/context/TagsContext';
import { Tag, Plus, X, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tags: string[]) => void;
}

export function TagSelectDialog({ isOpen, onClose, onConfirm }: TagSelectDialogProps) {
    const { tags: allTags, isLoading } = useTags();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedTags([]);
            setInputValue('');
        }
    }, [isOpen]);

    const toggleTag = (tagName: string) => {
        setSelectedTags(prev =>
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
    };

    const handleAddCustomTag = () => {
        const tag = inputValue.trim();
        if (tag && !selectedTags.includes(tag)) {
            setSelectedTags(prev => [...prev, tag]);
            setInputValue('');
        }
    };

    const handleConfirm = async () => {
        if (selectedTags.length === 0) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedTags);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTags = allTags.filter(t =>
        t.tag_name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(t.tag_name)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/40 shadow-2xl rounded-sm">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        批量添加标签
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">


                    {/* 搜索与输入 */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                placeholder="搜索或输入新标签..."
                                className="pl-9 h-9 rounded-sm bg-background border-border/40 focus-visible:ring-primary/20"
                            />
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleAddCustomTag}
                            disabled={!inputValue.trim()}
                            className="h-9 px-3 rounded-sm"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* 已选标签 - 紧凑展示 */}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-0.5">
                            {selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="gap-1 px-2 py-0.5 rounded-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-default text-[10px]"
                                >
                                    {tag}
                                    <button onClick={() => toggleTag(tag)} className="hover:text-destructive">
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* 推荐标签列表 */}
                    <div className="max-h-[200px] overflow-y-auto scrollbar-hide">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {filteredTags.length > 0 ? (
                                    filteredTags.map(tag => (
                                        <button
                                            key={tag.tag_name}
                                            onClick={() => toggleTag(tag.tag_name)}
                                            className="text-xs px-3 py-1.5 rounded-sm bg-accent/30 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all text-muted-foreground"
                                        >
                                            {tag.tag_name}
                                            <span className="ml-1 opacity-40 font-mono">({tag.count})</span>
                                        </button>
                                    ))
                                ) : inputValue ? (
                                    <div className="w-full text-center py-4 text-xs text-muted-foreground italic">
                                        按回车键创建新标签 "{inputValue}"
                                    </div>
                                ) : (
                                    <div className="w-full text-center py-4 text-xs text-muted-foreground italic">
                                        暂无推荐标签
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="rounded-sm">取消</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedTags.length === 0 || isSubmitting}
                        className="rounded-sm"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        确认添加
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
