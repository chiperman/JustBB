'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
}

export function OtpInput({ value, onChange, onComplete, disabled }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;

        const newOtp = value.split('');
        // Handle paste or multiple chars
        if (val.length > 1) {
            const digits = val.slice(0, 6).split('');
            const updated = Array(6).fill('');
            digits.forEach((d, i) => updated[i] = d);
            onChange(updated.join(''));
            if (updated.every(d => d !== '') && onComplete) {
                onComplete(updated.join(''));
            }
            return;
        }

        newOtp[index] = val;
        const result = newOtp.join('');
        onChange(result);

        if (val !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (result.length === 6 && onComplete) {
            onComplete(result);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && value[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array(6).fill(0).map((_, i) => (
                <Input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-10 h-12 text-center text-lg font-bold p-0 focus:ring-1 focus:ring-primary/30"
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
