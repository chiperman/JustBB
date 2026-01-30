import { describe, it, expect } from 'vitest';
import { parseContentTokens } from './contentParser';

describe('parseContentTokens', () => {
    it('should parse plain text', () => {
        const input = 'Hello World';
        const expected = [{ type: 'text', value: 'Hello World' }];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse references (@number)', () => {
        const input = '@123';
        const expected = [{ type: 'ref', value: '@123' }];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse tags (#tag)', () => {
        const input = '#tag123';
        const expected = [{ type: 'tag', value: '#tag123' }];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse chinese tags', () => {
        const input = '#中文标签';
        const expected = [{ type: 'tag', value: '#中文标签' }];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse simple image urls', () => {
        const input = 'https://example.com/image.png';
        const expected = [{ type: 'image', value: 'https://example.com/image.png' }];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse mixed content', () => {
        const input = 'Look at @123 and #cool stuff';
        const expected = [
            { type: 'text', value: 'Look at ' },
            { type: 'ref', value: '@123' },
            { type: 'text', value: ' and ' },
            { type: 'tag', value: '#cool' },
            { type: 'text', value: ' stuff' }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse image inside text', () => {
        const input = 'Here is a pic https://foo.com/bar.jpg nice?';
        const expected = [
            { type: 'text', value: 'Here is a pic ' },
            { type: 'image', value: 'https://foo.com/bar.jpg' },
            { type: 'text', value: ' nice?' }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should handle multiple matches adjacent', () => {
        const input = '#tag1@123';
        // Note: Logic might split this depending on regex. 
        // regex current: /(@\d+)|(#[\w\u4e00-\u9fa5]+)|(url)/g
        // #tag1 matches #tag1. @123 matches @123.
        const expected = [
            { type: 'tag', value: '#tag1' },
            { type: 'ref', value: '@123' }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });
});
