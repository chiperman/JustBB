export type LinkRenderMode = 'mention' | 'pill' | 'card';

interface PendingMarkupLinkLookupDoc {
    descendants: (
        callback: (node: {
            type: { name: string };
            attrs: { id?: string; isPending?: boolean };
        }, pos: number) => boolean | void
    ) => void;
}

export interface PendingMarkupLinkRef {
    url: string | null;
    pos: number | null;
}

interface SmartLinkTokenInput {
    title: string;
    url: string;
    mode?: LinkRenderMode;
}

interface SmartLinkHtmlInput extends SmartLinkTokenInput {
    isPending?: boolean;
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function formatSmartLinkToken({
    title,
    url,
    mode = 'mention',
}: SmartLinkTokenInput): string {
    const modeSuffix = mode !== 'mention' ? `|${mode}` : '';
    return `🔗[${title}](${url}${modeSuffix})`;
}

export function serializeSmartLinkHtml({
    title,
    url,
    mode = 'mention',
    isPending = false,
}: SmartLinkHtmlInput): string {
    const modeAttr = mode !== 'mention' ? ` data-mode="${mode}"` : '';
    const pendingAttr = isPending ? ' data-pending="true"' : '';

    return `<span data-type="markupLink" data-id="${escapeHtml(url)}" data-label="${escapeHtml(title)}"${modeAttr}${pendingAttr}>${escapeHtml(formatSmartLinkToken({ title, url, mode }))}</span>`;
}

export function replaceSmartLinkToken(
    docText: string,
    current: Required<SmartLinkTokenInput>,
    next: Pick<SmartLinkTokenInput, 'title' | 'url'>
): string | null {
    const oldToken = formatSmartLinkToken(current);
    if (!docText.includes(oldToken)) {
        return null;
    }

    return docText.replace(
        oldToken,
        formatSmartLinkToken({
            title: next.title,
            url: next.url,
            mode: current.mode,
        })
    );
}

export function findPendingMarkupLink(
    doc: PendingMarkupLinkLookupDoc,
    pendingRef: PendingMarkupLinkRef
): { pos: number } | null {
    if (!pendingRef.url) {
        return null;
    }

    let exactMatch: { pos: number } | null = null;

    doc.descendants((node, pos) => {
        if (
            node.type.name === 'markupLink'
            && node.attrs.isPending
            && node.attrs.id === pendingRef.url
            && (pendingRef.pos === null || pos === pendingRef.pos)
        ) {
            exactMatch = { pos };
            return false;
        }

        return true;
    });

    if (exactMatch || pendingRef.pos === null) {
        return exactMatch;
    }

    let fallbackMatch: { pos: number } | null = null;

    doc.descendants((node, pos) => {
        if (
            node.type.name === 'markupLink'
            && node.attrs.isPending
            && node.attrs.id === pendingRef.url
        ) {
            fallbackMatch = { pos };
            return false;
        }

        return true;
    });

    return fallbackMatch;
}
