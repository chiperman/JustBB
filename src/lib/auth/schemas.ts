import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(1, '请输入密码'),
});

export const signupSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码长度至少为 6 位'),
});

export const verifyOtpSchema = z.object({
    email: z.string().email('邮箱无效'),
    code: z.string().length(6, '请输入 6 位验证码'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
