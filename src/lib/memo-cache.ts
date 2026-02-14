const MEMO_CACHE_KEY = 'MEMO_DATA_CACHE_V1';

export interface CacheItem {
    id: string;
    memo_number: number;
    content: string; // Full text for search
    created_at: string;
    // Add optional fields for full feed rendering if needed, 
    // but for now we might keeping CacheItem simple or mapping FULL Memo to it?
    // Actually search.ts getAllMemos returns Memo[]. 
    // We should probably store Memo[] in cache if we want to render the feed from it.
    // Let's extend CacheItem or just use Memo type if possible, but to avoid circular deps with types, 
    // let's keep CacheItem generic or just use 'any' for now? 
    // Better: let's stick to the plan. MemoFeed needs FULL data. 
    // So CacheItem should be compatible with Memo. 
    // Let's update CacheItem to index signature or include needed fields.
    tags?: string[] | null;
    is_pinned?: boolean;
    is_locked?: boolean;
    is_private?: boolean;
    [key: string]: any;
}

class MemoCache {
    private static instance: MemoCache;
    private items: CacheItem[] = [];
    private isInitialized = false;
    private isFullyLoaded = false;
    private listeners: (() => void)[] = [];

    private constructor() {
        // Try load from storage immediately
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

        this.items = Array.from(mergedMap.values()).sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        this.isInitialized = true;
        this.saveToStorage();
        this.notify();
    }

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
                    // If we have data, we can assume it's somewhat loaded, 
                    // but maybe not "Fully" if we want to force a refresh?
                    // Let's assume if it's there, it's a good starting point.
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
