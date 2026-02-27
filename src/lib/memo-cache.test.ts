import { describe, it, expect, beforeEach } from 'vitest';
import { memoCache, CacheItem } from './memo-cache';

describe('MemoCache', () => {
    beforeEach(() => {
        // Reset cache state
        memoCache.setItems([]);
        memoCache.setInitialized(false);
    });

    it('should initialize with empty items', () => {
        expect(memoCache.getItems()).toEqual([]);
        expect(memoCache.getInitialized()).toBe(false);
    });

    it('should set items and mark as initialized', () => {
        const items: CacheItem[] = [
            { id: '1', memo_number: 1, content: 'test', created_at: new Date().toISOString() }
        ];
        memoCache.setItems(items);
        expect(memoCache.getItems()).toHaveLength(1);
        expect(memoCache.getInitialized()).toBe(true);
    });

    it('should add item to the beginning', () => {
        const item1: CacheItem = { id: '1', memo_number: 1, content: 'test1', created_at: '2023-01-01' };
        memoCache.setItems([item1]);

        const item2: CacheItem = { id: '2', memo_number: 2, content: 'test2', created_at: '2023-01-02' };
        memoCache.addItem(item2);

        const items = memoCache.getItems();
        expect(items).toHaveLength(2);
        expect(items[0]).toEqual(item2); // Newest first
    });

    it('should search by memo number only', () => {
        const items: CacheItem[] = [
            { id: '1', memo_number: 101, content: 'content1', created_at: '2023-01-01' },
            { id: '2', memo_number: 102, content: 'content2', created_at: '2023-01-02' },
            { id: '3', memo_number: 103, content: 'content3', created_at: '2023-01-03' }
        ];
        memoCache.setItems(items);

        // Search number
        expect(memoCache.search('102')).toHaveLength(1);
        expect(memoCache.search('102')[0].memo_number).toBe(102);

        // Zero matches for content keywords
        expect(memoCache.search('Apple')).toHaveLength(0);
    });

    it('should merge items correctly', () => {
        const oldItems: CacheItem[] = [
            { id: '1', memo_number: 1, content: 'old', created_at: '2023-01-01T10:00:00Z' }
        ];
        memoCache.setItems(oldItems);

        const newItems: CacheItem[] = [
            { id: '1', memo_number: 1, content: 'new', created_at: '2023-01-01T10:00:00Z' }, // Same ID
            { id: '2', memo_number: 2, content: 'item2', created_at: '2023-01-02T10:00:00Z' }
        ];

        memoCache.mergeItems(newItems);

        const items = memoCache.getItems();
        expect(items).toHaveLength(2);
        // Expect sort by date descending
        expect(items[0].id).toBe('2');
        expect(items[1].id).toBe('1');
    });
});
