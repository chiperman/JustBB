'use client';

import * as React from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function FontToggle() {
    const [isSans, setIsSans] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('font-preference');
        if (saved === 'sans') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSans(true);
            document.body.classList.add('font-sans');
        }
    }, []);

    const toggleFont = () => {
        const newVal = !isSans;
        setIsSans(newVal);
        if (newVal) {
            document.body.classList.add('font-sans');
            localStorage.setItem('font-preference', 'sans');
        } else {
            document.body.classList.remove('font-sans');
            localStorage.setItem('font-preference', 'serif');
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleFont}
            className="rounded-full w-10 h-10"
            title={`当前字体: ${isSans ? '无衬线' : '衬线'}`}
            aria-label={`切换字体，当前: ${isSans ? '无衬线' : '衬线'}`}
        >
            <Type className="w-4 h-4" aria-hidden="true" />
        </Button>
    );
}
