'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';

interface OtpInputProps {
    otp: string[];
    setOtp: (otp: string[]) => void;
}

export function OtpInput({ otp, setOtp }: OtpInputProps) {
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste from manual typing or browser autofill
            const pastedData = value.slice(0, 8).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (index + i < 8) newOtp[index + i] = char;
            });
            setOtp(newOtp);
            // Focus last filled or next
            const nextIndex = Math.min(index + pastedData.length, 7);
            otpInputs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 7) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="grid grid-cols-8 gap-2 py-4">
            {otp.map((digit, index) => (
                <div key={`otp-${index}`} className="relative">
                    <Input
                        ref={(el) => { otpInputs.current[index] = el; }}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-full aspect-square h-auto text-center text-2xl font-mono border-[1.5px] border-foreground/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 focus-visible:ring-0 transition-all duration-200 rounded-none bg-white p-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] flex items-center justify-center m-0"
                        autoComplete="one-time-code"
                    />
                </div>
            ))}
        </div>
    );
}
