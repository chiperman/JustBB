'use client';

import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon as Check } from '@hugeicons/core-free-icons';

interface PasswordStrengthProps {
    password?: string;
}

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
    const strength = useMemo(() => {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password)
        };

        const score = Object.values(requirements).filter(Boolean).length;
        let color = 'bg-muted/20';

        if (password.length > 0) {
            if (score <= 2) color = 'bg-red-400';
            else if (score <= 4) color = 'bg-yellow-400';
            else color = 'bg-green-400';
        }

        return { score, color, metRequirements: requirements };
    }, [password]);

    if (!password) return null;

    return (
        <div className="pt-4 pb-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 border-l-2 border-primary/5 pl-4 ml-1">
            <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div
                        key={s}
                        className={`flex-1 transition-all duration-700 rounded-full ${s <= strength.score ? strength.color : 'bg-foreground/[0.03]'}`}
                    />
                ))}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1.5 opacity-80">
                <RequirementItem met={strength.metRequirements.length} label="8位+" />
                <RequirementItem met={strength.metRequirements.upper && strength.metRequirements.lower} label="大小写" />
                <RequirementItem met={strength.metRequirements.number} label="数字" />
                <RequirementItem met={strength.metRequirements.symbol} label="符号" />
            </div>
        </div>
    );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5 group">
            <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${met ? 'bg-green-500/10 text-green-600 scale-110 shadow-[0_0_8px_rgba(34,197,94,0.15)]' : 'bg-foreground/[0.03] text-muted-foreground/20'}`}>
                {met ? <HugeiconsIcon icon={Check} size={8} className="stroke-[3.5]" /> : <div className="w-0.5 h-0.5 rounded-full bg-current opacity-40" />}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${met ? 'text-green-600/80' : 'text-muted-foreground/30'}`}>{label}</span>
        </div>
    );
}
