/**
 * 统一的 Server Action 响应接口
 */
export interface ActionResponse<T = unknown> {
    success: boolean;
    error: string | null;
    data?: T;
}
