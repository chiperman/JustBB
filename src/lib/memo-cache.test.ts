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
            { id: '1', memo_number: 1, content: 'Test 1', created_at: new Date().toISOString() }
        ];
        memoCache.setItems(items);
        expect(memoCache.getItems()).toHaveLength(1);
        expect(memoCache.getInitialized()).toBe(true);
    });

    it('should add item to the beginning', () => {
        const item1: CacheItem = { id: '1', memo_number: 1, content: 'Old', created_at: '2023-01-01' };
        memoCache.setItems([item1]);

        const item2: CacheItem = { id: '2', memo_number: 2, content: 'New', created_at: '2023-01-02' };
        memoCache.addItem(item2);

        const items = memoCache.getItems();
        expect(items).toHaveLength(2);
        expect(items[0]).toEqual(item2); // Newest first
    });

    it('should search by content or memo number', () => {
        const items: CacheItem[] = [
            { id: '1', memo_number: 101, content: 'Apple', created_at: '2023-01-01' },
            { id: '2', memo_number: 102, content: 'Banana', created_at: '2023-01-02' },
            { id: '3', memo_number: 103, content: 'Orange', created_at: '2023-01-03' }
        ];
        memoCache.setItems(items);

        // Search content
        expect(memoCache.search('App')).toHaveLength(1);
        expect(memoCache.search('App')[0].content).toBe('Apple');

        // Search number
        expect(memoCache.search('102')).toHaveLength(1);
        expect(memoCache.search('102')[0].memo_number).toBe(102);

        // Limit check
        expect(memoCache.search('an')).toHaveLength(2); // Banana, Orange
    });

    it('should merge items correctly', () => {
        const oldItems: CacheItem[] = [
            { id: '1', memo_number: 1, content: 'One', created_at: '2023-01-01T10:00:00Z' }
        ];
        memoCache.setItems(oldItems);

        const newItems: CacheItem[] = [
            { id: '1', memo_number: 1, content: 'One Updated', created_at: '2023-01-01T10:00:00Z' }, // Same ID
            { id: '2', memo_number: 2, content: 'Two', created_at: '2023-01-02T10:00:00Z' }
        ];

        memoCache.mergeItems(newItems);

        const items = memoCache.getItems();
        expect(items).toHaveLength(2);
        // Expect sort by date descending
        expect(items[0].id).toBe('2');
        expect(items[1].id).toBe('1');
    });
});
