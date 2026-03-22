import type { VercelRequest } from '@vercel/node';

/**
 * Vercel Node 関数では req.body が未パースの文字列の場合があるため正規化する
 */
export function parseJsonBody<T extends Record<string, unknown>>(req: VercelRequest): T {
    const raw = req.body as unknown;
    if (raw == null || raw === '') return {} as T;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as T;
        } catch {
            return {} as T;
        }
    }
    if (typeof raw === 'object') {
        return raw as T;
    }
    return {} as T;
}
