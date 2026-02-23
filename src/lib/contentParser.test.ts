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

    // ===== Location Token Tests (TDD) =====

    it('should parse a basic location marker', () => {
        const input = '📍[东京塔](35.6586,139.7454)';
        const expected = [
            { type: 'location', value: '📍[东京塔](35.6586,139.7454)', name: '东京塔', lat: 35.6586, lng: 139.7454 }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse location with negative coordinates', () => {
        const input = '📍[Buenos Aires](-34.6037,-58.3816)';
        const expected = [
            { type: 'location', value: '📍[Buenos Aires](-34.6037,-58.3816)', name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse location with integer coordinates', () => {
        const input = '📍[原点](0,0)';
        const expected = [
            { type: 'location', value: '📍[原点](0,0)', name: '原点', lat: 0, lng: 0 }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse location mixed with text and tags', () => {
        const input = '今天去了 📍[西湖](30.2590,120.1388) 真美 #旅行';
        const expected = [
            { type: 'text', value: '今天去了 ' },
            { type: 'location', value: '📍[西湖](30.2590,120.1388)', name: '西湖', lat: 30.2590, lng: 120.1388 },
            { type: 'text', value: ' 真美 ' },
            { type: 'tag', value: '#旅行' }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse multiple locations in one content', () => {
        const input = '从 📍[上海](31.2304,121.4737) 飞到 📍[东京](35.6762,139.6503)';
        const expected = [
            { type: 'text', value: '从 ' },
            { type: 'location', value: '📍[上海](31.2304,121.4737)', name: '上海', lat: 31.2304, lng: 121.4737 },
            { type: 'text', value: ' 飞到 ' },
            { type: 'location', value: '📍[东京](35.6762,139.6503)', name: '东京', lat: 35.6762, lng: 139.6503 }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should parse location with spaces in coordinates', () => {
        const input = '📍[纽约](40.7128, -74.0060)';
        const expected = [
            { type: 'location', value: '📍[纽约](40.7128, -74.0060)', name: '纽约', lat: 40.7128, lng: -74.0060 }
        ];
        expect(parseContentTokens(input)).toEqual(expected);
    });

    it('should NOT parse incomplete location syntax (missing coords)', () => {
        const input = '📍[某地] 只是个标记';
        const tokens = parseContentTokens(input);
        // Should be parsed as plain text, not as location
        expect(tokens.every(t => t.type !== 'location')).toBe(true);
    });
});
