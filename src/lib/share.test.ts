import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMemoShareUrl, getPublicAppUrl } from './share';

describe('share helpers', () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    afterEach(() => {
        if (originalAppUrl === undefined) {
            delete process.env.NEXT_PUBLIC_APP_URL;
        } else {
            process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
        }

        vi.unstubAllGlobals();
    });

    it('prefers NEXT_PUBLIC_APP_URL for share links', () => {
        process.env.NEXT_PUBLIC_APP_URL = 'https://memo.example.com/';

        expect(getPublicAppUrl()).toBe('https://memo.example.com');
        expect(getMemoShareUrl('memo-123')).toBe('https://memo.example.com/share/memo-123');
    });

    it('falls back to window origin when public app url is not configured', () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        vi.stubGlobal('window', {
            location: {
                origin: 'https://local-preview.example.com/',
            },
        });

        expect(getPublicAppUrl()).toBe('https://local-preview.example.com');
        expect(getMemoShareUrl('memo-456')).toBe('https://local-preview.example.com/share/memo-456');
    });

    it('returns a relative share path on the server without public app url', () => {
        delete process.env.NEXT_PUBLIC_APP_URL;

        expect(getPublicAppUrl()).toBe('');
        expect(getMemoShareUrl('memo-789')).toBe('/share/memo-789');
    });
});
