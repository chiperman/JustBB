export type LinkRenderMode = 'mention' | 'pill' | 'card';

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
