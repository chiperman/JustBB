const MEMO_CACHE_KEY = 'MEMO_DATA_CACHE_V1';

export interface CacheItem {
    id: string;
    memo_number: number;
    created_at: string;
    content: string;
}

class MemoCache {
    private static instance: MemoCache;
    private items: CacheItem[] = [];
    private isInitialized = false;
    private isFullyLoaded = false;
    private listeners: (() => void)[] = [];

    private constructor() {
        if (typeof window !== 'undefined') {
            this.loadFromStorage();
        }
    }

    public static getInstance(): MemoCache {
        if (!MemoCache.instance) {
            MemoCache.instance = new MemoCache();
        }
        return MemoCache.instance;
    }

    public subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener());
    }

    public setInitialized(value: boolean) {
        this.isInitialized = value;
    }

    public getInitialized(): boolean {
        return this.isInitialized;
    }

    // 在轻量索引模式下，"FullyLoaded" 指的是索引加载完成
    public setFullyLoaded(value: boolean) {
        this.isFullyLoaded = value;
        if (value) {
            this.saveToStorage();
        }
    }

    public getFullyLoaded(): boolean {
        return this.isFullyLoaded;
    }

    public setItems(items: CacheItem[]) {
        this.items = items;
        this.isInitialized = true;
        this.isFullyLoaded = true;
        this.saveToStorage();
        this.notify();
    }

    public getItems(): CacheItem[] {
        return this.items;
    }

    public addItem(item: CacheItem) {
        this.items.unshift(item);
        this.saveToStorage();
        this.notify();
    }

    public removeItem(id: string) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveToStorage();
        this.notify();
    }

    public mergeItems(newItems: CacheItem[]) {
        const mergedMap = new Map<string, CacheItem>();

        newItems.forEach(i => mergedMap.set(i.id, i));
        this.items.forEach(i => {
            if (!mergedMap.has(i.id)) {
                mergedMap.set(i.id, i);
            }
        });

        // 索引模式下仅按创建时间倒序排列
        this.items = Array.from(mergedMap.values()).sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        this.isInitialized = true;
        this.saveToStorage();
        this.notify();
    }

    /**
     * 重构后的搜索逻辑：仅支持按编号搜索。
     * 内容匹配将通过远程 API 并行执行。
     */
    public search(query: string): CacheItem[] {
        if (!query) return this.items;

        const lowerQuery = query.toLowerCase();
        return this.items.filter(item =>
            item.memo_number.toString().includes(lowerQuery) ||
            item.content.toLowerCase().includes(lowerQuery)
        );
    }

    private loadFromStorage() {
        try {
            const raw = localStorage.getItem(MEMO_CACHE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data)) {
                    this.items = data;
                    this.isInitialized = true;
                }
            }
        } catch (e) {
            console.error('Failed to load memo cache', e);
        }
    }

    private saveToStorage() {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(MEMO_CACHE_KEY, JSON.stringify(this.items));
            }
        } catch (e) {
            console.error('Failed to save memo cache', e);
        }
    }
}

export const memoCache = MemoCache.getInstance();
