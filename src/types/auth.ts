export type UserRole = 'admin' | 'user';

export interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
    role?: UserRole;
    name?: string;
}
