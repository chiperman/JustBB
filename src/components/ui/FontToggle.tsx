'use client';

import * as React from 'react';
import { Type } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FontToggle() {
    const [isSans, setIsSans] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('font-preference');
        if (saved === 'sans') {
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
        <button
            onClick={toggleFont}
            className="p-2 w-10 h-10 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors"
            title={`当前字体: ${isSans ? '无衬线' : '衬线'}`}
        >
            <Type className="w-4 h-4" />
        </button>
    );
}
