import { describe, it, expect } from 'vitest';
import { mergeTagsIntoContent } from './parser';

describe('mergeTagsIntoContent', () => {
    it('应该能向已有内容中添加新标签', () => {
        const content = '这是一条笔记';
        const existingTags = ['旧标签'];
        const newTags = ['新标签'];
        
        const result = mergeTagsIntoContent(content, existingTags, newTags);
        
        expect(result.tags).toContain('旧标签');
        expect(result.tags).toContain('新标签');
        expect(result.content).toBe('这是一条笔记 #新标签');
    });

    it('不应该重复添加已存在的标签', () => {
        const content = '笔记 #已有标签';
        const existingTags = ['已有标签'];
        const newTags = ['已有标签', '新标签'];
        
        const result = mergeTagsIntoContent(content, existingTags, newTags);
        
        expect(result.tags).toHaveLength(2);
        expect(result.content).toBe('笔记 #已有标签 #新标签');
    });

    it('在内容已有标签但标签数组缺失时应能正确合并', () => {
        const content = '笔记 #手动标签';
        const existingTags: string[] = [];
        const newTags = ['手动标签'];
        
        const result = mergeTagsIntoContent(content, existingTags, newTags);
        
        expect(result.tags).toEqual(['手动标签']);
        expect(result.content).toBe('笔记 #手动标签'); // 不应重复追加内容
    });

    it('处理空内容和空数组时应保持健壮', () => {
        const result = mergeTagsIntoContent('', [], ['标签']);
        expect(result.content).toBe('#标签');
        expect(result.tags).toEqual(['标签']);
    });
});
