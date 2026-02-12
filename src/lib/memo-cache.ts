export interface CacheItem {
    id: string;
    memo_number: number;
    content: string; // Full text for search
    created_at: string;
}

class MemoCache {
    private static instance: MemoCache;
    private items: CacheItem[] = [];
    private isInitialized = false;
    private isFullyLoaded = false; // New flag to track if full index is loaded
    private initPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): MemoCache {
        if (!MemoCache.instance) {
            MemoCache.instance = new MemoCache();
        }
        return MemoCache.instance;
    }

    public setInitialized(value: boolean) {
        this.isInitialized = value;
    }

    public getInitialized(): boolean {
        return this.isInitialized;
    }

    public setFullyLoaded(value: boolean) {
        this.isFullyLoaded = value;
    }

    public getFullyLoaded(): boolean {
        return this.isFullyLoaded;
    }

    public setItems(items: CacheItem[]) {
        this.items = items;
        this.isInitialized = true;
        this.isFullyLoaded = true;
    }

    public getItems(): CacheItem[] {
        return this.items;
    }

    public addItem(item: CacheItem) {
        // Prepend new item
        this.items.unshift(item);
    }

    // Merge logic: keep existing items, add new ones if not present (simple id check)
    // Assuming 'newItems' are the "latest" full list or a chunk. 
    // For this specific requirement (background full fetch), we usually just overwrite 
    // or intelligently merge. Overwriting is safest if we fetched "all".
    // But we need to preserve the order (newest first).
    public mergeItems(newItems: CacheItem[]) {
        const existingIds = new Set(this.items.map(i => i.id));
        const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));

        // If we assumed newItems is the "Master Truth" sorted by time, 
        // we might just want to set it. 
        // But to be safe against race conditions (e.g. user created a memo while fetching),
        // we might want to do key-based deduplication.

        // Strategy: Create map from newItems (latest server state), 
        // but also keep any items in 'this.items' that *aren't* in newItems? 
        // (Maybe user created them locally but they aren't on server yet? 
        // No, local creation sends to server).

        // Simplest strategy for "Background Full Fetch": 
        // Just Use the new list, but check if we have any "very new" items 
        // locally that might be missing? 
        // Actually, if we just fetched from server, it should be accurate.
        // Let's just use a Map to merge and sort.

        const mergedMap = new Map<string, CacheItem>();

        // Priority: current items (might have just-created ones) overwrites fetched? 
        // No, fetched is source of truth usually. 
        // Let's trust the input 'newItems' as the source of truth, 
        // BUT if we just added a local item, it might be in 'this.items' but not yet in 'newItems' 
        // (if the fetch started *before* the creation finished? Unlikely with await).

        // User requirement: "Background fetch... merge silently".
        // Let's just combine and dedup by ID, then sort by ID or CreatedAt.

        const allItems = [...this.items, ...newItems];
        // Dedup keeping the first occurrence (which is from this.items, preserving local state if needed)
        // actually, Map keeps last set value.

        // Better:
        newItems.forEach(i => mergedMap.set(i.id, i));
        this.items.forEach(i => {
            if (!mergedMap.has(i.id)) {
                // Maybe a just-created item that hasn't synced? Keep it.
                mergedMap.set(i.id, i);
            }
        });

        this.items = Array.from(mergedMap.values()).sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        this.isInitialized = true;
    }

    public search(query: string): CacheItem[] {
        if (!query) return this.items;

        const lowerQuery = query.toLowerCase();
        return this.items.filter(item =>
            item.memo_number.toString().includes(lowerQuery) ||
            item.content.toLowerCase().includes(lowerQuery)
        );
    }
}

export const memoCache = MemoCache.getInstance();
